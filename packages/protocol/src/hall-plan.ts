import { z } from 'zod'

import { MAX_TABLES, tableNumberSchema } from './identifiers.ts'

/** The plan's grid is this many places wide and deep: a hall rarely holds more than a dozen tables. */
export const HALL_GRID_SIZE = 12

const hallPlaceSchema = z
  .number()
  .int()
  .min(0)
  .max(HALL_GRID_SIZE - 1)

/** One table where it stands in the hall, one place of the plan's grid. */
export const hallTableSchema = z.object({
  column: hallPlaceSchema,
  /** Put away for the day: nothing is seated on it and the wall leaves it out. */
  isHidden: z.boolean().default(false),
  row: hallPlaceSchema,
  table: tableNumberSchema
})
export type HallTable = z.infer<typeof hallTableSchema>

/**
 * The hall seen from above, the stands at the bottom: where each table
 * stands. Tables `2k − 1` and `2k` form a block that hosts one encounter.
 */
export const hallPlanSchema = z.object({
  tables: z.array(hallTableSchema).max(MAX_TABLES)
})
export type HallPlan = z.infer<typeof hallPlanSchema>
