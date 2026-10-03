import type { MatchState } from '@scoreboard/protocol/match-state'
import type {
  InstantMs,
  StampedEvent
} from '@scoreboard/protocol/scoring-event'

export type MatchTimes = {
  /** `null` for a walkover: a match never played has no length. */
  durationMs: number | null
  finishedAtMs: InstantMs | null
  startedAtMs: InstantMs | null
}

/**
 * When the match was played, from the server's stamps: it started with its
 * first start or concession, and finished with the event that closed it,
 * which is the last one of a finished match's log.
 */
export const matchTimesOf = (
  log: readonly StampedEvent[],
  state: MatchState
): MatchTimes => {
  const startedAtMs =
    state.status === 'scheduled'
      ? null
      : (log.find(
          ({ event }) =>
            event.type === 'match.started' || event.type === 'match.conceded'
        )?.recordedAtMs ?? null)
  const finishedAtMs =
    state.status === 'finished' ? (log.at(-1)?.recordedAtMs ?? null) : null
  const isWalkover = state.concession?.reason === 'walkover'

  return {
    durationMs:
      startedAtMs === null || finishedAtMs === null || isWalkover
        ? null
        : finishedAtMs - startedAtMs,
    finishedAtMs,
    startedAtMs
  }
}
