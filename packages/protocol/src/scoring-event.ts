import { z } from 'zod'

import { scoringEventIdSchema } from './identifiers'
import { scoreSchema, sideSchema } from './side'

export const matchStartedSchema = z.object({
  firstServer: sideSchema,
  id: scoringEventIdSchema,
  type: z.literal('match.started')
})

export const pointScoredSchema = z.object({
  id: scoringEventIdSchema,
  side: sideSchema,
  type: z.literal('point.scored')
})

/** Cancels the latest scoring event still in effect: a point, a correction, a concession or an end. */
export const scoreUndoneSchema = z.object({
  id: scoringEventIdSchema,
  type: z.literal('score.undone')
})

/** The organiser rewriting the score: every period so far, the last one possibly in progress. */
export const scoreCorrectedSchema = z.object({
  id: scoringEventIdSchema,
  periods: z.array(scoreSchema).max(20),
  type: z.literal('score.corrected')
})

/**
 * `retirement`: the side stopped during the match. `walkover`: the side never
 * played it — absent, injured beforehand, or refusing.
 */
export const concessionReasons = ['retirement', 'walkover'] as const
export const concessionReasonSchema = z.enum(concessionReasons)
export type ConcessionReason = z.infer<typeof concessionReasonSchema>

export const matchConcededSchema = z.object({
  by: sideSchema,
  id: scoringEventIdSchema,
  reason: concessionReasonSchema,
  type: z.literal('match.conceded')
})

/** Closes a match the score cannot close by itself, like a timed one. */
export const matchEndedSchema = z.object({
  id: scoringEventIdSchema,
  type: z.literal('match.ended')
})

export const scoringEventSchema = z.discriminatedUnion('type', [
  matchStartedSchema,
  pointScoredSchema,
  scoreUndoneSchema,
  scoreCorrectedSchema,
  matchConcededSchema,
  matchEndedSchema
])
export type ScoringEvent = z.infer<typeof scoringEventSchema>
export type ScoringEventType = ScoringEvent['type']
