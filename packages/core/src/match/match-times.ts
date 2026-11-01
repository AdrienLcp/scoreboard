import type { TimeoutCall } from '@scoreboard/protocol/event-snapshot'
import type { MatchState } from '@scoreboard/protocol/match-state'
import type {
  InstantMs,
  StampedEvent
} from '@scoreboard/protocol/scoring-event'

export type MatchTimes = {
  /** `null` for a walkover: a match never played has no length. */
  durationMs: number | null
  finishedAtMs: InstantMs | null
  lastTimeout: TimeoutCall | null
  startedAtMs: InstantMs | null
}

const isWithdrawal = ({ event }: StampedEvent): boolean =>
  event.type === 'card.withdrawn' || event.type === 'timeout.withdrawn'

/**
 * A side calls one time-out per match, so its latest call in the log is the
 * one in effect whenever the state says it is taken.
 */
const lastTimeoutOf = (
  log: readonly StampedEvent[],
  state: MatchState
): TimeoutCall | null => {
  const call = log.findLast(
    ({ event }) => event.type === 'timeout.called' && state.timeouts[event.side]
  )

  return call?.event.type === 'timeout.called'
    ? { calledAtMs: call.recordedAtMs, side: call.event.side }
    : null
}

/**
 * When the match was played, from the server's stamps: it started with its
 * first start or concession, and finished with the event that closed it,
 * which is the last one of a finished match's log but for a mis-tap taken
 * back afterwards.
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
    state.status === 'finished'
      ? (log.findLast((stamped) => !isWithdrawal(stamped))?.recordedAtMs ??
        null)
      : null
  const isWalkover = state.concession?.reason === 'walkover'

  return {
    durationMs:
      startedAtMs === null || finishedAtMs === null || isWalkover
        ? null
        : finishedAtMs - startedAtMs,
    finishedAtMs,
    lastTimeout: lastTimeoutOf(log, state),
    startedAtMs
  }
}
