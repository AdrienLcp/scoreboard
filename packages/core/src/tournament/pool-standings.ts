import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { PlayerId } from '@scoreboard/protocol/identifiers'
import type { Pool, Tournament } from '@scoreboard/protocol/tournament'

import { opponentOf } from '../match/opponent'
import { wonLostRatio } from '../ranking/won-lost-ratio'

/** A player's line in his pool's table. */
export type PoolStanding = {
  gamesLost: number
  gamesWon: number
  /**
   * The tie-break could not part him from a player level with him: the
   * organiser's draw, or the pool number without one, placed him.
   */
  isDrawn: boolean
  losses: number
  /** His number in the pool, 1 for the best ranked. */
  number: number
  playerId: PlayerId
  points: number
  pointsLost: number
  pointsWon: number
  /** 1 for the pool's winner. */
  rank: number
  wins: number
}

/** A pool's table, best first, and whether every match of it is over. */
export type PoolTable = {
  /** Each group of players the tie-break leaves level, in the order the draw gives them. */
  drawnGroups: PlayerId[][]
  isComplete: boolean
  pool: Pool
  standings: PoolStanding[]
}

type Tally = Pick<
  PoolStanding,
  'gamesLost' | 'gamesWon' | 'losses' | 'pointsLost' | 'pointsWon' | 'wins'
>

const EMPTY_TALLY: Tally = {
  gamesLost: 0,
  gamesWon: 0,
  losses: 0,
  pointsLost: 0,
  pointsWon: 0,
  wins: 0
}

const isSinglesOf = (match: MatchView, playerId: PlayerId) =>
  match.home.playerIds.includes(playerId) ||
  match.away.playerIds.includes(playerId)

const tallyOf = (playerId: PlayerId, matches: readonly MatchView[]): Tally =>
  matches.reduce((tally, match) => {
    if (match.state.status !== 'finished' || !isSinglesOf(match, playerId)) {
      return tally
    }

    const side = match.home.playerIds.includes(playerId) ? 'home' : 'away'
    const other = opponentOf(side)
    const periods = match.state.periods

    return {
      gamesLost: tally.gamesLost + match.state.periodsWon[other],
      gamesWon: tally.gamesWon + match.state.periodsWon[side],
      losses: tally.losses + (match.state.winner === other ? 1 : 0),
      pointsLost:
        tally.pointsLost +
        periods.reduce((sum, period) => sum + period[other], 0),
      pointsWon:
        tally.pointsWon +
        periods.reduce((sum, period) => sum + period[side], 0),
      wins: tally.wins + (match.state.winner === side ? 1 : 0)
    }
  }, EMPTY_TALLY)

/** A player in the order the tie-break gives, with the level group a draw had to place him in. */
type Ordered = { drawnWith: readonly PlayerId[] | null; playerId: PlayerId }

/**
 * Orders players level on wins. Two: the winner of their match. Three or more:
 * the ratio of games, then of points, over the matches between them only (the
 * FFTT's practice), going back to the start for any smaller group still level.
 */
const breakTie = ({
  drawRank,
  level,
  matches
}: {
  drawRank: (playerId: PlayerId) => number
  level: readonly PlayerId[]
  matches: readonly MatchView[]
}): Ordered[] => {
  if (level.length === 1) {
    return level.map((playerId) => ({ drawnWith: null, playerId }))
  }

  const between = matches.filter((match) =>
    [...match.home.playerIds, ...match.away.playerIds].every((playerId) =>
      level.includes(playerId)
    )
  )
  const byDraw = (): Ordered[] =>
    level
      .toSorted((left, right) => drawRank(left) - drawRank(right))
      .map((playerId) => ({ drawnWith: level, playerId }))

  if (level.length === 2) {
    const [first, second] = level
    const winner = between
      .map((match) => {
        const { winner: side } = match.state

        return side === null ? undefined : match[side].playerIds[0]
      })
      .find((playerId) => playerId !== undefined)

    if (winner === undefined || first === undefined || second === undefined) {
      return byDraw()
    }

    return [winner, winner === first ? second : first].map((playerId) => ({
      drawnWith: null,
      playerId
    }))
  }

  const keyOf = (playerId: PlayerId): readonly [number, number] => {
    const tally = tallyOf(playerId, between)

    return [
      wonLostRatio(tally.gamesWon, tally.gamesLost),
      wonLostRatio(tally.pointsWon, tally.pointsLost)
    ]
  }
  const groups = new Map<
    string,
    { key: readonly [number, number]; ids: PlayerId[] }
  >()

  for (const playerId of level) {
    const key = keyOf(playerId)
    const id = key.join('/')
    groups.set(id, { ids: [...(groups.get(id)?.ids ?? []), playerId], key })
  }

  if (groups.size === 1) {
    return byDraw()
  }

  return [...groups.values()]
    .toSorted(
      (left, right) => right.key[0] - left.key[0] || right.key[1] - left.key[1]
    )
    .flatMap(({ ids }) => breakTie({ drawRank, level: ids, matches }))
}

/** The pool's table from the matches of its round robin, ranked by points then the tie-break. */
export const poolTableFor = ({
  matches,
  pool,
  tournament
}: {
  /** The pool's own matches. */
  matches: readonly MatchView[]
  pool: Pool
  tournament: Pick<Tournament, 'drawOrder' | 'lossPoints' | 'winPoints'>
}): PoolTable => {
  const tallies = new Map(
    pool.playerIds.map((playerId) => [playerId, tallyOf(playerId, matches)])
  )
  const pointsOf = (playerId: PlayerId): number => {
    const tally = tallies.get(playerId) ?? EMPTY_TALLY

    return (
      tally.wins * tournament.winPoints + tally.losses * tournament.lossPoints
    )
  }
  const drawRank = (playerId: PlayerId): number => {
    const drawn = tournament.drawOrder.indexOf(playerId)

    return drawn === -1
      ? tournament.drawOrder.length + pool.playerIds.indexOf(playerId)
      : drawn
  }
  const levels = [...new Set(pool.playerIds.map(pointsOf))].toSorted(
    (left, right) => right - left
  )
  const ordered = levels.flatMap((points) =>
    breakTie({
      drawRank,
      level: pool.playerIds.filter((playerId) => pointsOf(playerId) === points),
      matches
    })
  )

  return {
    drawnGroups: [
      ...new Set(
        ordered.flatMap(({ drawnWith }) =>
          drawnWith === null ? [] : [drawnWith]
        )
      )
    ].map((group) =>
      ordered
        .filter(({ drawnWith }) => drawnWith === group)
        .map(({ playerId }) => playerId)
    ),
    isComplete:
      matches.length > 0 &&
      matches.every((match) => match.state.status === 'finished'),
    pool,
    standings: ordered.map(({ drawnWith, playerId }, index) => ({
      ...(tallies.get(playerId) ?? EMPTY_TALLY),
      isDrawn: drawnWith !== null,
      number: pool.playerIds.indexOf(playerId) + 1,
      playerId,
      points: pointsOf(playerId),
      rank: index + 1
    }))
  }
}

/** Both pools' tables, each from the matches staged in it. */
export const poolTablesFor = ({
  matches,
  tournament
}: {
  matches: readonly MatchView[]
  tournament: Tournament
}): PoolTable[] =>
  tournament.pools.map((pool) =>
    poolTableFor({
      matches: matches.filter(
        (match) =>
          match.stage?.kind === 'pool' && match.stage.poolId === pool.id
      ),
      pool,
      tournament
    })
  )
