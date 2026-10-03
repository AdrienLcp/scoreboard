import { z } from 'zod'

export const sports = ['table-tennis'] as const
export const sportSchema = z.enum(sports)
export type Sport = z.infer<typeof sportSchema>

export const tableTennisBestOfs = [3, 5, 7] as const

export const tableTennisFormatSchema = z.object({
  bestOf: z.literal(tableTennisBestOfs),
  pointsPerGame: z.number().int().min(3).max(99),
  sport: z.literal('table-tennis')
})
export type TableTennisFormat = z.infer<typeof tableTennisFormatSchema>

/** One member per sport: a new sport adds its format here and its ruleset in core. */
export const matchFormatSchema = z.discriminatedUnion('sport', [
  tableTennisFormatSchema
])
export type MatchFormat = z.infer<typeof matchFormatSchema>
