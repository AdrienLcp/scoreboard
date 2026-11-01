import type { PublicSnapshot } from '@scoreboard/protocol/event-snapshot'
import type { TableNumber } from '@scoreboard/protocol/identifiers'

import { hallPlanOf } from '@scoreboard/core/hall/hall-plan'

import {
  type WallArea,
  type WallFloor,
  type WallPlace,
  wallFloorFor,
  wallHallFor
} from '@/features/display/wall-hall'
import { MAX_WALL_ROWS, wallRowsFor } from '@/features/display/wall-rows'
import { wallTournamentFor } from '@/features/display/wall-tournament'

/** An encounter, a pool or a pair of tables, in its home team's colour when it has one. */
export type SketchGroup = {
  colour: string | null
  id: string
  tables: readonly TableNumber[]
}

/** A group where its tables stand: its area on the wall, and each table's place inside it counted from 1. */
export type SketchFrame = SketchGroup & {
  area: WallArea
  places: readonly WallPlace[]
}

/** The wall as the hall in small; `join` is `null` when the QR takes a column beside. */
export type SketchHall = {
  columns: number
  frames: SketchFrame[]
  join: WallArea | null
  rows: number
}

/** A screen's wall in small, both ways: its groups in rows, and as the hall. */
export type ScreenSketch = {
  /** Whether the wall can stand as the hall today; always before it shows encounters or pools. */
  canShowHall: boolean
  groups: SketchGroup[]
  /** `null` when the plan cannot hold the screen's tables. */
  hall: SketchHall | null
}

const TABLES_PER_PAIR = 2

const pairsOf = (tables: readonly TableNumber[]): SketchGroup[] =>
  Array.from(
    {
      length: Math.min(
        Math.ceil(tables.length / TABLES_PER_PAIR),
        MAX_WALL_ROWS
      )
    },
    (_, index) => {
      const pair = tables.slice(
        index * TABLES_PER_PAIR,
        (index + 1) * TABLES_PER_PAIR
      )

      return { colour: null, id: pair.join('-'), tables: pair }
    }
  )

const tableFrameOf = (table: TableNumber, place: WallPlace): SketchFrame => ({
  area: { column: place.column, columnSpan: 1, row: place.row, rowSpan: 1 },
  colour: null,
  id: String(table),
  places: [{ column: 1, row: 1 }],
  tables: [table]
})

const floorSketchOf = (floor: WallFloor): SketchHall => ({
  columns: floor.columns,
  frames: [...floor.places].map(([table, place]) => tableFrameOf(table, place)),
  join:
    floor.join === null ? null : { ...floor.join, columnSpan: 1, rowSpan: 1 },
  rows: floor.rows
})

/**
 * What a screen's wall looks like each way, drawn from the same rules as the
 * wall itself: its encounters, or a tournament's pools, in rows and where
 * they stand. Before the wall shows either, its tables two by two in rows,
 * each where it stands.
 */
export const screenSketchOf = ({
  snapshot,
  tables
}: {
  snapshot: PublicSnapshot
  tables: readonly TableNumber[]
}): ScreenSketch => {
  const nowMs = snapshot.generatedAtMs
  const plan = hallPlanOf(snapshot)
  const encounterRows = wallRowsFor({ nowMs, snapshot, tables })

  if (encounterRows !== null) {
    const hall = wallHallFor({ plan, rows: encounterRows })
    const groupOf = (row: (typeof encounterRows)[number]): SketchGroup => ({
      colour: row.home.colour,
      id: row.id,
      tables: row.tables.map(({ table }) => table)
    })

    return {
      canShowHall: hall !== null,
      groups: encounterRows.map(groupOf),
      hall:
        hall === null
          ? null
          : {
              columns: hall.columns,
              frames: hall.frames.map(({ area, places, row }) => ({
                ...groupOf(row),
                area,
                places: [...places.values()]
              })),
              join: hall.join,
              rows: hall.rows
            }
    }
  }

  const poolRows = wallTournamentFor({ nowMs, snapshot, tables })

  if (poolRows !== null) {
    const floor = wallFloorFor({
      plan,
      tables: poolRows.flatMap((row) => row.tables.map(({ table }) => table))
    })

    return {
      canShowHall: floor !== null,
      groups: poolRows.map((row) => ({
        colour: null,
        id: row.id,
        tables: row.tables.map(({ table }) => table)
      })),
      hall: floor === null ? null : floorSketchOf(floor)
    }
  }

  const floor = wallFloorFor({ plan, tables })

  return {
    canShowHall: true,
    groups: pairsOf(tables),
    hall: floor === null ? null : floorSketchOf(floor)
  }
}
