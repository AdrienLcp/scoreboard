import { z } from 'zod'

import { concessionReasonSchema } from './scoring-event'
import { scoreSchema, sideSchema } from './side'

export const matchStatuses = ['scheduled', 'live', 'finished'] as const
export const matchStatusSchema = z.enum(matchStatuses)
export type MatchStatus = z.infer<typeof matchStatusSchema>

/** What one more point would decide for the side holding it. */
export const stakeSchema = z.object({
  decides: z.enum(['period', 'match']),
  side: sideSchema
})
export type Stake = z.infer<typeof stakeSchema>

/**
 * Where the coming serve falls in its server's turn: the first of two, the
 * second of two, or a lone serve when the sport alternates every point.
 */
export const serveTurnSchema = z.object({
  serve: z.number().int().positive(),
  serves: z.number().int().positive()
})
export type ServeTurn = z.infer<typeof serveTurnSchema>

export const concessionSchema = z.object({
  by: sideSchema,
  reason: concessionReasonSchema
})
export type Concession = z.infer<typeof concessionSchema>

/**
 * A match as every screen reads it, whatever the sport. A period is a game in
 * table tennis, a set in volleyball, a half in football.
 */
export const matchStateSchema = z.object({
  canUndo: z.boolean(),
  concession: concessionSchema.nullable(),
  /** The period being played; `null` before the start and once the match is over. */
  current: scoreSchema.nullable(),
  /** `true` once the sides stand at the ends opposite to where they started. */
  endsSwapped: z.boolean(),
  periods: z.array(scoreSchema),
  periodsWon: scoreSchema,
  serveTurn: serveTurnSchema.nullable().default(null),
  serving: sideSchema.nullable(),
  stake: stakeSchema.nullable(),
  status: matchStatusSchema,
  winner: sideSchema.nullable()
})
export type MatchState = z.infer<typeof matchStateSchema>

/** A match nobody has started: the state every match begins from. */
export const scheduledMatchState: MatchState = {
  canUndo: false,
  concession: null,
  current: null,
  endsSwapped: false,
  periods: [],
  periodsWon: { away: 0, home: 0 },
  serveTurn: null,
  serving: null,
  stake: null,
  status: 'scheduled',
  winner: null
}
