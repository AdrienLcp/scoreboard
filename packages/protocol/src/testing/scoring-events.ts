import { randomUUID } from 'node:crypto'

import type { PlayerId } from '../identifiers'
import type {
  CardPenalty,
  InstantMs,
  ScoringEvent,
  StampedEvent
} from '../scoring-event'
import type { Score, Side } from '../side'

export const started = (firstServer: Side = 'home'): ScoringEvent => ({
  firstServer,
  id: randomUUID(),
  type: 'match.started'
})

export const point = (side: Side): ScoringEvent => ({
  id: randomUUID(),
  side,
  type: 'point.scored'
})

/** The umpire closing the period the score has won. */
export const confirmed = (): ScoringEvent => ({
  id: randomUUID(),
  type: 'period.confirmed'
})

export const timeout = (side: Side): ScoringEvent => ({
  id: randomUUID(),
  side,
  type: 'timeout.called'
})

export const timeoutWithdrawn = (side: Side): ScoringEvent => ({
  id: randomUUID(),
  side,
  type: 'timeout.withdrawn'
})

export const card = ({
  penalty = 0,
  playerId = null,
  side
}: {
  penalty?: CardPenalty
  playerId?: PlayerId | null
  side: Side
}): Extract<ScoringEvent, { type: 'card.shown' }> => ({
  id: randomUUID(),
  penalty,
  playerId,
  side,
  type: 'card.shown'
})

export const cardWithdrawn = (cardId: string): ScoringEvent => ({
  cardId,
  id: randomUUID(),
  type: 'card.withdrawn'
})

export const undo = (): ScoringEvent => ({
  id: randomUUID(),
  type: 'score.undone'
})

export const correction = (periods: Score[]): ScoringEvent => ({
  id: randomUUID(),
  periods,
  type: 'score.corrected'
})

/** The side that never showed up concedes the match. */
export const walkover = (by: Side = 'away'): ScoringEvent => ({
  by,
  id: randomUUID(),
  reason: 'walkover',
  type: 'match.conceded'
})

/** The side that can no longer play concedes a match already under way. */
export const retirement = (by: Side): ScoringEvent => ({
  by,
  id: randomUUID(),
  reason: 'retirement',
  type: 'match.conceded'
})

export const stampedAt = (
  recordedAtMs: InstantMs,
  event: ScoringEvent
): StampedEvent => ({ event, recordedAtMs })
