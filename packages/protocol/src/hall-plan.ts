import { z } from 'zod'

import { MAX_TABLES, tableNumberSchema } from './identifiers.ts'

/** A table's play area in metres, the federation's minimum for a regional hall: its long side runs along the stands unless turned. */
export const PLAY_AREA_LENGTH_M = 10
export const PLAY_AREA_WIDTH_M = 5

/** The club's hall seen from above, in metres, the stands along its bottom side. */
export const DEFAULT_HALL_WIDTH_M = 37
export const DEFAULT_HALL_DEPTH_M = 20
const MAX_HALL_SIDE_M = 400

const metresSchema = z.number().min(0).max(MAX_HALL_SIDE_M)

/** One table where it stands in the hall. */
export const hallTableSchema = z.object({
  /** Put away for the day: off the plan, nothing is seated on it and the wall leaves it out. */
  isHidden: z.boolean().default(false),
  /** Turned a quarter: its long side runs from the far wall towards the stands. */
  isTurned: z.boolean().default(false),
  table: tableNumberSchema,
  /** The left edge of its play area, in metres from the hall's left wall. */
  x: metresSchema,
  /** The far edge of its play area, in metres from the hall's far wall. */
  y: metresSchema
})
export type HallTable = z.infer<typeof hallTableSchema>

/** Room left between the walls and the tables when a plan of the old grid is laid out in metres. */
const GRID_MARGIN_M = 2
/** An empty column or row of the old grid was an aisle. */
const GRID_AISLE_M = 3

type GridTable = { column: number; row: number }

const isGridTable = (value: unknown): value is GridTable =>
  typeof value === 'object' &&
  value !== null &&
  'column' in value &&
  'row' in value &&
  !('x' in value)

/** Each used track of the old grid takes `size`, an empty one between two used ones an aisle. */
const trackStarts = (used: readonly number[], size: number) => {
  const tracks = [...new Set(used)].sort((one, other) => one - other)
  const starts = new Map<number, number>()
  let start = GRID_MARGIN_M

  for (const [index, track] of tracks.entries()) {
    const previous = tracks[index - 1]

    if (previous !== undefined) {
      start += size + (track - previous - 1 > 0 ? GRID_AISLE_M : 0)
    }

    starts.set(track, start)
  }

  return { end: start + (tracks.length > 0 ? size : 0), starts }
}

/**
 * A plan kept before tables stood anywhere: each place of the 12 × 12 grid
 * becomes a play area, neighbours touching, an empty place between two
 * tables an aisle.
 */
const fromGridPlan = (value: unknown): unknown => {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('tables' in value) ||
    !Array.isArray(value.tables) ||
    !value.tables.some(isGridTable)
  ) {
    return value
  }

  const tables = value.tables.filter(isGridTable)
  const columns = trackStarts(
    tables.map((table) => table.column),
    PLAY_AREA_LENGTH_M
  )
  const rows = trackStarts(
    tables.map((table) => table.row),
    PLAY_AREA_WIDTH_M
  )

  return {
    depth: Math.max(DEFAULT_HALL_DEPTH_M, rows.end + GRID_MARGIN_M),
    tables: tables.map(({ column, row, ...table }) => ({
      ...table,
      isTurned: false,
      x: columns.starts.get(column) ?? 0,
      y: rows.starts.get(row) ?? 0
    })),
    width: Math.max(DEFAULT_HALL_WIDTH_M, columns.end + GRID_MARGIN_M)
  }
}

/**
 * The hall seen from above, the stands along the bottom: where each table
 * stands. Tables `2k − 1` and `2k` form a block that hosts one encounter.
 */
export const hallPlanSchema = z.preprocess(
  fromGridPlan,
  z.object({
    depth: metresSchema.default(DEFAULT_HALL_DEPTH_M),
    tables: z.array(hallTableSchema).max(MAX_TABLES),
    width: metresSchema.default(DEFAULT_HALL_WIDTH_M)
  })
)
export type HallPlan = z.infer<typeof hallPlanSchema>

export const MAX_CLUB_HALL_PLANS = 20

export const clubHallPlanIdSchema = z.string().trim().min(1).max(40)
export type ClubHallPlanId = z.infer<typeof clubHallPlanIdSchema>

/** One way the club sets its hall up ("Salle à 8 tables", "Top 12"), picked when a day is prepared. */
export const clubHallPlanSchema = z.object({
  id: clubHallPlanIdSchema,
  /** `null` reads as the hall's table count ("Salle à 8 tables"). */
  name: z.string().trim().min(1).max(60).nullable(),
  plan: hallPlanSchema
})
export type ClubHallPlan = z.infer<typeof clubHallPlanSchema>
