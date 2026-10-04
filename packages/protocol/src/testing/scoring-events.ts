import { randomUUID } from 'node:crypto'

import type { InstantMs, ScoringEvent, StampedEvent } from '../scoring-event'
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
