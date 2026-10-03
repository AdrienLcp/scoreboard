import { Result } from '@adrienlcp/result'

import type { TableTennisFormat } from '@scoreboard/protocol/match-format'
import type { Score, Side } from '@scoreboard/protocol/side'

import type { Ruleset, RulesetView, Ruling } from '../match/ruleset'
import {
  decidingGameEndChangeAt,
  gamePointHolder,
  gamesToWinMatch,
  gameWinner,
  isFinishedGame,
  isGameInProgress,
  serverOf
} from './table-tennis-game'

export type TableTennisProgress = {
  completedGames: readonly Score[]
  currentGame: Score
  firstServer: Side
  format: TableTennisFormat
}

const LOVE_ALL: Score = { away: 0, home: 0 }

const gamesWonIn = (games: readonly Score[], pointsPerGame: number): Score => {
  const winsFor = (side: Side): number =>
    games.filter((game) => gameWinner(game, pointsPerGame) === side).length

  return { away: winsFor('away'), home: winsFor('home') }
}

const matchWinnerOf = (gamesWon: Score, bestOf: number): Side | null => {
  const needed = gamesToWinMatch(bestOf)

  if (gamesWon.home >= needed) {
    return 'home'
  }

  return gamesWon.away >= needed ? 'away' : null
}

const isDecidingGame = (progress: TableTennisProgress): boolean =>
  progress.completedGames.length === progress.format.bestOf - 1

const endsSwappedIn = (progress: TableTennisProgress): boolean => {
  const isSwappedBetweenGames = progress.completedGames.length % 2 === 1
  const isSwappedInDecidingGame =
    isDecidingGame(progress) &&
    Math.max(progress.currentGame.home, progress.currentGame.away) >=
      decidingGameEndChangeAt(progress.format.pointsPerGame)

  return isSwappedBetweenGames !== isSwappedInDecidingGame
}

const view = (progress: TableTennisProgress): RulesetView => {
  const { bestOf, pointsPerGame } = progress.format
  const periodsWon = gamesWonIn(progress.completedGames, pointsPerGame)
  const winner = matchWinnerOf(periodsWon, bestOf)
  const periods = [...progress.completedGames]

  if (winner !== null) {
    return {
      current: null,
      endsSwapped: endsSwappedIn(progress),
      periods,
      periodsWon,
      serving: null,
      stake: null,
      winner
    }
  }

  const holder = gamePointHolder(progress.currentGame, pointsPerGame)
  const decidesMatch =
    holder !== null && periodsWon[holder] + 1 >= gamesToWinMatch(bestOf)

  return {
    current: progress.currentGame,
    endsSwapped: endsSwappedIn(progress),
    periods,
    periodsWon,
    serving: serverOf({
      firstServer: progress.firstServer,
      gameIndex: progress.completedGames.length,
      pointsPerGame,
      score: progress.currentGame
    }),
    stake:
      holder === null
        ? null
        : { decides: decidesMatch ? 'match' : 'period', side: holder },
    winner: null
  }
}

const award = (
  progress: TableTennisProgress,
  side: Side
): Ruling<TableTennisProgress, 'match_over'> => {
  if (view(progress).winner !== null) {
    return Result.failure('match_over')
  }

  const scored = {
    ...progress.currentGame,
    [side]: progress.currentGame[side] + 1
  }

  if (gameWinner(scored, progress.format.pointsPerGame) === null) {
    return Result.success({ progress: { ...progress, currentGame: scored } })
  }

  return Result.success({
    progress: {
      ...progress,
      completedGames: [...progress.completedGames, scored],
      currentGame: LOVE_ALL
    }
  })
}

/** Whether the match was already won after one of `games`, before the last. */
const isDecidedBeforeLast = (
  games: readonly Score[],
  format: TableTennisFormat
): boolean =>
  games.some(
    (_, index) =>
      index < games.length - 1 &&
      matchWinnerOf(
        gamesWonIn(games.slice(0, index + 1), format.pointsPerGame),
        format.bestOf
      ) !== null
  )

/**
 * Every game but the last must be over and the match must not be decided
 * before the last one; the last may be over or still being played.
 */
const correct = (
  progress: TableTennisProgress,
  periods: readonly Score[]
): Ruling<TableTennisProgress, 'invalid_score'> => {
  const { format } = progress
  const last = periods.at(-1)

  if (last === undefined) {
    return Result.success({
      progress: { ...progress, completedGames: [], currentGame: LOVE_ALL }
    })
  }

  const isLastOver = isFinishedGame(last, format.pointsPerGame)
  const games = periods.slice(0, -1)
  const isEveryEarlierGameOver = games.every((game) =>
    isFinishedGame(game, format.pointsPerGame)
  )
  const isLastValid = isLastOver || isGameInProgress(last, format.pointsPerGame)
  const isWonBeforeCurrent =
    !isLastOver &&
    matchWinnerOf(gamesWonIn(games, format.pointsPerGame), format.bestOf) !==
      null

  if (
    !isEveryEarlierGameOver ||
    !isLastValid ||
    isWonBeforeCurrent ||
    isDecidedBeforeLast(periods, format)
  ) {
    return Result.failure('invalid_score')
  }

  return Result.success({
    progress: {
      ...progress,
      completedGames: isLastOver ? [...periods] : games,
      currentGame: isLastOver ? LOVE_ALL : last
    }
  })
}

/** Table tennis under ITTF rules: games to 11, two clear points, best of 3, 5 or 7. */
export const tableTennisRuleset: Ruleset<
  TableTennisFormat,
  TableTennisProgress
> = {
  award,
  begin: ({ firstServer, format }) => ({
    completedGames: [],
    currentGame: LOVE_ALL,
    firstServer,
    format
  }),
  correct,
  end: () => Result.failure('cannot_end'),
  view
}
