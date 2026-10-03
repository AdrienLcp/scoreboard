import type { MatchId, ScoringEventId } from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'

/** A scoring event waiting for the server to confirm it holds it. */
export type PendingRecord = {
  event: ScoringEvent
  matchId: MatchId
}

/** Pending records in the order they were scored, which is the order they are resent in. */
export type Outbox = readonly PendingRecord[]

export const enqueue = (outbox: Outbox, record: PendingRecord): Outbox => [
  ...outbox,
  record
]

/** Drops a record the server accepted or refused: either way it is settled. */
export const settle = (outbox: Outbox, eventId: ScoringEventId): Outbox =>
  outbox.filter((record) => record.event.id !== eventId)

export const pendingEventsFor = (
  outbox: Outbox,
  matchId: MatchId
): ScoringEvent[] =>
  outbox
    .filter((record) => record.matchId === matchId)
    .map((record) => record.event)
