import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { TableNumber } from '@scoreboard/protocol/identifiers'
import type { Side } from '@scoreboard/protocol/side'

import {
  areaOf,
  type HallGrid,
  hallGridOf,
  hallPlanOf,
  standingTablesOf
} from '@scoreboard/core/hall/hall-plan'

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

/** Two columns of tables this far apart, or more, stand either side of an aisle. */
const AISLE_M = 1

/** Two tables a row, block by block, when the hall does not read as rows and columns. */
const blockGridOf = (tables: readonly TableNumber[]): HallGrid => ({
  columns: Math.min(2, tables.length),
  places: new Map(
    tables.map((table, index) => [
      table,
      { column: index % 2, row: Math.floor(index / 2) }
    ])
  ),
  rows: Math.ceil(tables.length / 2)
})

/**
 * The hall plan with the tables put away left out, read as rows and columns:
 * an aisle between two columns of tables stays, drawn narrow.
 */
export const roomLayoutOf = (snapshot: PublicSnapshot): RoomLayout => {
  const plan = hallPlanOf(snapshot)
  const standing = standingTablesOf(plan).toSorted(
    (one, other) => one.table - other.table
  )
  const hallGrid = hallGridOf(plan)
  const grid = hallGrid ?? blockGridOf(standing.map((table) => table.table))
  const columnOf = (table: TableNumber) => grid.places.get(table)?.column ?? 0
  const edgesOf = (column: number) => {
    const areas = standing
      .filter((table) => columnOf(table.table) === column)
      .map(areaOf)

    return {
      end: Math.max(...areas.map((area) => area.x + area.width)),
      start: Math.min(...areas.map((area) => area.x))
    }
  }
  const hasAisleBefore = (column: number) =>
    hallGrid !== null &&
    column > 0 &&
    edgesOf(column).start - edgesOf(column - 1).end >= AISLE_M
  const tracks = Array.from({ length: grid.columns }, (_, column) =>
    hasAisleBefore(column) ? [false, true] : [true]
  )
  const trackOf = (column: number) => tracks.slice(0, column + 1).flat().length

  return {
    columns: tracks.flat(),
    rows: grid.rows,
    tables: standing.map((standingTable) => {
      const current = currentMatchOn(snapshot, standingTable.table)
      const place = grid.places.get(standingTable.table)

      return {
        column: trackOf(place?.column ?? 0),
        live: current?.state.status === 'live' ? current : null,
        next: current?.state.status === 'scheduled' ? current : null,
        row: (place?.row ?? 0) + 1,
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
