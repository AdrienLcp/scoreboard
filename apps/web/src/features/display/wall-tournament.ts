import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { PlayerId, TableNumber } from '@scoreboard/protocol/identifiers'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'
import type { Side } from '@scoreboard/protocol/side'

import { poolTablesFor } from '@scoreboard/core/tournament/pool-standings'

import { currentMatchOn } from '@/features/event/table-match'
import { paintOf, type TeamPaint } from '@/features/event/team-paint'

import { heldMatchOn } from './display-stage'
import { MAX_WALL_ROWS, type WallTable, wallTableOf } from './wall-rows'

/** More tables than this side by side and a table stops being legible: the row goes on a second line. */
const MAX_TABLES_PER_LINE = 4

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
      /** The lines its tables take, at most four tables side by side. */
      lines: number
      matches: readonly MatchView[]
      name: string
      standings: WallStanding[]
      tables: WallTable[]
    }
  | {
      id: string
      kind: 'bracket'
      lines: number
      matches: readonly MatchView[]
      tables: WallTable[]
    }

const BRACKET_ROW = 'bracket'

const rowIdOf = (match: MatchView): string | null =>
  match.stage == null
    ? null
    : match.stage.kind === 'pool'
      ? match.stage.poolId
      : BRACKET_ROW

const linesFor = (tables: readonly WallTable[]): number =>
  Math.ceil(tables.length / MAX_TABLES_PER_LINE)

/**
 * The wall of an individual tournament: one row per pool with its table and
 * its tables, then the final phase once its matches hold tables; `null` when
 * the day has no tournament or a shown table plays outside it.
 */
export const wallTournamentFor = ({
  nowMs,
  snapshot,
  tables
}: {
  nowMs: InstantMs
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

    const rowId = rowIdOf(current)

    if (rowId === null) {
      return null
    }

    const held = heldMatchOn({ nowMs, snapshot, table })
    const wallTable = wallTableOf({
      current,
      held: held !== null && rowIdOf(held) === rowId ? held : null,
      table
    })

    byRow.set(rowId, [...(byRow.get(rowId) ?? []), wallTable])
  }

  const lineCount = [...byRow.values()].reduce(
    (sum, rowTables) => sum + linesFor(rowTables),
    0
  )

  if (byRow.size === 0 || lineCount > MAX_WALL_ROWS) {
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
            lines: linesFor(rowTables),
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
            lines: linesFor(bracketTables),
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
