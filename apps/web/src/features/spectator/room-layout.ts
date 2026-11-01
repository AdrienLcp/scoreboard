import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { TableNumber } from '@scoreboard/protocol/identifiers'
import type { Side } from '@scoreboard/protocol/side'

import { hallPlanOf } from '@scoreboard/core/hall/hall-plan'

import { currentMatchOn } from '@/features/event/table-match'
import { paintOf, type TeamPaint } from '@/features/event/team-paint'

/** One table standing in the hall, where the spectator's plan draws it. */
export type RoomTable = {
  /** Its column on the plan, counted from 1 as CSS does. */
  column: number
  live: MatchView | null
  /** The match a free table waits for. */
  next: MatchView | null
  /** Its row on the plan, counted from 1, the stands below the last one. */
  row: number
  table: TableNumber
}

/** The hall from above on a visitor's phone: the tables standing today where they stand. */
export type RoomLayout = {
  /** Each column between the first table and the last: `false` for an aisle, drawn narrow. */
  columns: boolean[]
  rows: number
  tables: RoomTable[]
}

const tracksOf = (places: readonly number[]): number[] =>
  [...new Set(places)].sort((one, other) => one - other)

/**
 * The hall plan with the tables put away left out: empty columns between
 * tables stay as aisles, a row nobody stands on closes up.
 */
export const roomLayoutOf = (snapshot: PublicSnapshot): RoomLayout => {
  const standing = hallPlanOf(snapshot).tables.filter(
    (table) => !table.isHidden
  )
  const columns = tracksOf(standing.map((table) => table.column))
  const rows = tracksOf(standing.map((table) => table.row))
  const firstColumn = columns[0] ?? 0
  const lastColumn = columns.at(-1) ?? -1

  return {
    columns: Array.from({ length: lastColumn - firstColumn + 1 }, (_, index) =>
      columns.includes(firstColumn + index)
    ),
    rows: rows.length,
    tables: standing
      .toSorted((one, other) => one.table - other.table)
      .map((standingTable) => {
        const current = currentMatchOn(snapshot, standingTable.table)

        return {
          column: standingTable.column - firstColumn + 1,
          live: current?.state.status === 'live' ? current : null,
          next: current?.state.status === 'scheduled' ? current : null,
          row: rows.indexOf(standingTable.row) + 1,
          table: standingTable.table
        }
      })
  }
}

/** The colour a side wears on the plan: its encounter's team, or its player's own team. */
export const sidePaintOf = ({
  match,
  side,
  snapshot
}: {
  match: MatchView
  side: Side
  snapshot: PublicSnapshot
}): TeamPaint => {
  const encounter = snapshot.encounters.find(
    (candidate) => candidate.id === match.encounterId
  )
  const [firstPlayerId] = match[side].playerIds
  const teamId =
    encounter?.[side] ??
    snapshot.players.find((player) => player.id === firstPlayerId)?.teamId

  return paintOf(snapshot.teams.find((team) => team.id === teamId))
}
