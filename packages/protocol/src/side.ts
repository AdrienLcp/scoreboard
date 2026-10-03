import { z } from 'zod'

/** The two sides of every match, whatever the sport: players, pairs or teams. */
export const sides = ['home', 'away'] as const
export const sideSchema = z.enum(sides)
export type Side = z.infer<typeof sideSchema>

const tallySchema = z.number().int().nonnegative().max(999)

export const scoreSchema = z.object({
  away: tallySchema,
  home: tallySchema
})
export type Score = z.infer<typeof scoreSchema>
