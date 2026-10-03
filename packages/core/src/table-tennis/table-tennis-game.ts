import type { Score, Side } from '@scoreboard/protocol/side'

import { opponentOf } from '../match/opponent'

const WINNING_MARGIN = 2
const SERVES_PER_TURN = 2

const leaderOf = (score: Score): Side | null => {
  if (score.home === score.away) {
    return null
  }

  return score.home > score.away ? 'home' : 'away'
}

const highOf = (score: Score): number => Math.max(score.home, score.away)
const lowOf = (score: Score): number => Math.min(score.home, score.away)

export const gamesToWinMatch = (bestOf: number): number => Math.ceil(bestOf / 2)

/** The side that has taken the game, or `null` while it is still on. */
export const gameWinner = (score: Score, pointsPerGame: number): Side | null =>
  highOf(score) >= pointsPerGame &&
  highOf(score) - lowOf(score) >= WINNING_MARGIN
    ? leaderOf(score)
    : null

/** A won game whose last point was the one that won it: no 13-10, no 11-10. */
export const isFinishedGame = (
  score: Score,
  pointsPerGame: number
): boolean => {
  if (gameWinner(score, pointsPerGame) === null) {
    return false
  }

  return highOf(score) === pointsPerGame
    ? lowOf(score) <= pointsPerGame - WINNING_MARGIN
    : highOf(score) - lowOf(score) === WINNING_MARGIN
}

/** A score a game can stand at while still being played. */
export const isGameInProgress = (
  score: Score,
  pointsPerGame: number
): boolean =>
  gameWinner(score, pointsPerGame) === null &&
  (highOf(score) < pointsPerGame ||
    highOf(score) - lowOf(score) < WINNING_MARGIN)

/** From 10-10 in a game to 11, the serve changes after every point. */
const isPastDeuce = (score: Score, pointsPerGame: number): boolean =>
  lowOf(score) >= pointsPerGame - 1

/**
 * The receiver of a game's first serve serves first in the next one, and the
 * serve changes every two points, then every point from 10-10.
 */
export const serverOf = ({
  firstServer,
  gameIndex,
  pointsPerGame,
  score
}: {
  firstServer: Side
  gameIndex: number
  pointsPerGame: number
  score: Score
}): Side => {
  const gameServer = gameIndex % 2 === 0 ? firstServer : opponentOf(firstServer)
  const played = score.home + score.away
  const deucePoints = 2 * (pointsPerGame - 1)
  const turnsTaken = isPastDeuce(score, pointsPerGame)
    ? deucePoints / SERVES_PER_TURN + (played - deucePoints)
    : Math.floor(played / SERVES_PER_TURN)

  return turnsTaken % 2 === 0 ? gameServer : opponentOf(gameServer)
}

/** The side one point away from taking the game, if any. */
export const gamePointHolder = (
  score: Score,
  pointsPerGame: number
): Side | null => {
  const withPointFor = (side: Side): Score => ({
    ...score,
    [side]: score[side] + 1
  })

  if (gameWinner(withPointFor('home'), pointsPerGame) === 'home') {
    return 'home'
  }

  if (gameWinner(withPointFor('away'), pointsPerGame) === 'away') {
    return 'away'
  }

  return null
}

/** In the deciding game, the ends change when a side first reaches this score: 5 in a game to 11. */
export const decidingGameEndChangeAt = (pointsPerGame: number): number =>
  Math.floor(pointsPerGame / 2)
