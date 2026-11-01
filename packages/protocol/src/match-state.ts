import { z } from 'zod'

import { playerIdSchema, scoringEventIdSchema } from './identifiers'
import { cardPenaltySchema, concessionReasonSchema } from './scoring-event'
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

/** A card still in effect in this match. `id` is the event that showed it. */
export const matchCardSchema = z.object({
  id: scoringEventIdSchema,
  penalty: cardPenaltySchema,
  playerId: playerIdSchema.nullable(),
  side: sideSchema
})
export type MatchCard = z.infer<typeof matchCardSchema>

/** Whether each side has used its time-out in this match. */
export const timeoutsTakenSchema = z.object({
  away: z.boolean(),
  home: z.boolean()
})
export type TimeoutsTaken = z.infer<typeof timeoutsTakenSchema>

/**
 * A match as every screen reads it, whatever the sport. A period is a game in
 * table tennis, a set in volleyball, a half in football.
 */
export const matchStateSchema = z.object({
  /**
   * A period the score has won, still on screen until the umpire confirms
   * it: `decides` says whether confirming it ends the match.
   */
  awaiting: stakeSchema.nullable().default(null),
  canUndo: z.boolean(),
  cards: z.array(matchCardSchema).default([]),
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
  timeouts: timeoutsTakenSchema.default({ away: false, home: false }),
  winner: sideSchema.nullable()
})
export type MatchState = z.infer<typeof matchStateSchema>

/** A match nobody has started: the state every match begins from. */
export const scheduledMatchState: MatchState = {
  awaiting: null,
  canUndo: false,
  cards: [],
  concession: null,
  current: null,
  endsSwapped: false,
  periods: [],
  periodsWon: { away: 0, home: 0 },
  serveTurn: null,
  serving: null,
  stake: null,
  status: 'scheduled',
  timeouts: { away: false, home: false },
  winner: null
}
