import { z } from 'zod'

import { playerIdSchema, scoringEventIdSchema } from './identifiers.ts'
import { scoreSchema, sideSchema } from './side.ts'

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

/**
 * The umpire closing a period the score has already won: until then the won
 * score stays on every screen and no point is taken. Confirming the period
 * that wins the match finishes it.
 */
export const periodConfirmedSchema = z.object({
  id: scoringEventIdSchema,
  type: z.literal('period.confirmed')
})

/** A side's time-out: one per match, a minute long. */
export const timeoutCalledSchema = z.object({
  id: scoringEventIdSchema,
  side: sideSchema,
  type: z.literal('timeout.called')
})

/** Takes back a time-out tapped by mistake, whenever it was. */
export const timeoutWithdrawnSchema = z.object({
  id: scoringEventIdSchema,
  side: sideSchema,
  type: z.literal('timeout.withdrawn')
})

/** Points a card gives the opponent: none for a yellow, 1 then 2 for a yellow and red. */
export const cardPenalties = [0, 1, 2] as const
export const cardPenaltySchema = z.literal(cardPenalties)
export type CardPenalty = z.infer<typeof cardPenaltySchema>

/**
 * A card shown to a player of `side`. Cards follow the player through the
 * encounter, so the umpire's console reads his earlier ones and sends the
 * penalty this one carries. `playerId` is `null` when the side has nobody
 * named yet.
 */
export const cardShownSchema = z.object({
  id: scoringEventIdSchema,
  penalty: cardPenaltySchema,
  playerId: playerIdSchema.nullable(),
  side: sideSchema,
  type: z.literal('card.shown')
})

/** Takes back a card. Its penalty points stay in the score: undo removes both, a correction fixes the score later. */
export const cardWithdrawnSchema = z.object({
  cardId: scoringEventIdSchema,
  id: scoringEventIdSchema,
  type: z.literal('card.withdrawn')
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
  matchEndedSchema,
  periodConfirmedSchema,
  timeoutCalledSchema,
  timeoutWithdrawnSchema,
  cardShownSchema,
  cardWithdrawnSchema
])
export type ScoringEvent = z.infer<typeof scoringEventSchema>
export type ScoringEventType = ScoringEvent['type']

/** Epoch milliseconds, as the server's clock read them. */
export const instantMsSchema = z.number().int().nonnegative()
export type InstantMs = z.infer<typeof instantMsSchema>

/** A scoring event as the server holds it: stamped on arrival, never by the device that sent it. */
export const stampedEventSchema = z.object({
  event: scoringEventSchema,
  recordedAtMs: instantMsSchema
})
export type StampedEvent = z.infer<typeof stampedEventSchema>
