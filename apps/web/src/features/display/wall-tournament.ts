import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { PlayerId, TableNumber } from '@scoreboard/protocol/identifiers'
import type { Side } from '@scoreboard/protocol/side'

import { poolTablesFor } from '@scoreboard/core/tournament/pool-standings'

import {
  currentMatchOn,
  paintOf,
  type TeamPaint,
  type WallTable,
  wallTableOf
} from './wall-rows'

/** Pools of up to eight play on four tables at once: more and a row stops being legible. */
const MAX_TABLES_PER_ROW = 4

/** A player's line in his pool's table on the wall: his club's colour and logo, his pool points. */
export type WallStanding = {
  logoUrl: string | null
  name: string
  /** His number in the pool, shown in his letter square. */
  number: number
  paint: TeamPaint
  playerId: PlayerId
  points: number
  rank: number
}

/** One row of a tournament wall: a pool and its tables, or the final phase and its own. */
export type WallTournamentRow =
  | {
      /** A match of the pool is over: its table starts to say who goes through. */
      hasResults: boolean
      id: string
      kind: 'pool'
      isComplete: boolean
      matches: readonly MatchView[]
      name: string
      standings: WallStanding[]
      tables: WallTable[]
    }
  | {
      id: string
      kind: 'bracket'
      matches: readonly MatchView[]
      tables: WallTable[]
    }

const BRACKET_ROW = 'bracket'

/**
 * The wall of an individual tournament: one row per pool with its table and
 * its tables, then the final phase once its matches hold tables; `null` when
 * the day has no tournament or a shown table plays outside it.
 */
export const wallTournamentFor = ({
  snapshot,
  tables
}: {
  snapshot: PublicSnapshot
  tables: readonly TableNumber[]
}): WallTournamentRow[] | null => {
  const { tournament } = snapshot

  if (tournament === null || tournament === undefined) {
    return null
  }

  const byRow = new Map<string, WallTable[]>()

  for (const table of tables) {
    const current = currentMatchOn(snapshot, table)

    if (current === null) {
      continue
    }

    if (current.stage == null) {
      return null
    }

    const rowId =
      current.stage.kind === 'pool' ? current.stage.poolId : BRACKET_ROW

    byRow.set(rowId, [...(byRow.get(rowId) ?? []), wallTableOf(current, table)])
  }

  if (
    byRow.size === 0 ||
    [...byRow.values()].some((row) => row.length > MAX_TABLES_PER_ROW)
  ) {
    return null
  }

  const teamOf = (playerId: PlayerId) => {
    const teamId = snapshot.players.find(
      (player) => player.id === playerId
    )?.teamId

    return snapshot.teams.find((team) => team.id === teamId)
  }
  const pools = poolTablesFor({ matches: snapshot.matches, tournament })
  const poolRows = pools.flatMap((poolTable): WallTournamentRow[] => {
    const rowTables = byRow.get(poolTable.pool.id)

    return rowTables === undefined
      ? []
      : [
          {
            hasResults: snapshot.matches.some(
              (match) =>
                match.stage?.kind === 'pool' &&
                match.stage.poolId === poolTable.pool.id &&
                match.state.status === 'finished'
            ),
            id: poolTable.pool.id,
            isComplete: poolTable.isComplete,
            kind: 'pool',
            matches: snapshot.matches.filter(
              (match) =>
                match.stage?.kind === 'pool' &&
                match.stage.poolId === poolTable.pool.id
            ),
            name: poolTable.pool.name,
            standings: poolTable.standings.map((standing) => ({
              logoUrl: teamOf(standing.playerId)?.logoUrl ?? null,
              name:
                snapshot.players.find(
                  (player) => player.id === standing.playerId
                )?.name ?? '',
              number: standing.number,
              paint: paintOf(teamOf(standing.playerId)),
              playerId: standing.playerId,
              points: standing.points,
              rank: standing.rank
            })),
            tables: rowTables
          }
        ]
  })
  const bracketTables = byRow.get(BRACKET_ROW)
  const bracketRows: WallTournamentRow[] =
    bracketTables === undefined
      ? []
      : [
          {
            id: BRACKET_ROW,
            kind: 'bracket',
            matches: snapshot.matches.filter(
              (match) => match.stage != null && match.stage.kind !== 'pool'
            ),
            tables: bracketTables
          }
        ]

  return [...poolRows, ...bracketRows]
}

/** A side of a tournament match as the wall paints it: the colour of the club its player stands for. */
export const tournamentPaintOf = (
  snapshot: Pick<PublicSnapshot, 'players' | 'teams'>,
  match: MatchView,
  side: Side
): TeamPaint => {
  const [playerId] = match[side].playerIds
  const teamId = snapshot.players.find(
    (player) => player.id === playerId
  )?.teamId

  return paintOf(snapshot.teams.find((team) => team.id === teamId))
}

/** A player's number in his pool, for his letter square; empty in the final phase's unknown seats. */
export const poolNumberOf = (
  snapshot: Pick<PublicSnapshot, 'tournament'>,
  match: MatchView,
  side: Side
): string => {
  const [playerId] = match[side].playerIds
  const pool = snapshot.tournament?.pools.find((candidate) =>
    candidate.playerIds.some((id) => id === playerId)
  )
  const index =
    playerId === undefined ? -1 : (pool?.playerIds.indexOf(playerId) ?? -1)

  return index === -1 ? '' : String(index + 1)
}
