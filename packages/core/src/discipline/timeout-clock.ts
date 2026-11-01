import type { TimeoutCall } from '@scoreboard/protocol/event-snapshot'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'

/** A time-out lasts one minute. */
export const TIMEOUT_MS = 60_000

/** The time-out still running and how long it has left, or `null` once it is over. */
export const runningTimeoutOf = ({
  lastTimeout,
  nowMs
}: {
  lastTimeout: TimeoutCall | null
  nowMs: InstantMs
}): (TimeoutCall & { remainingMs: number }) | null => {
  if (lastTimeout === null) {
    return null
  }

  const remainingMs = lastTimeout.calledAtMs + TIMEOUT_MS - nowMs

  return remainingMs > 0 ? { ...lastTimeout, remainingMs } : null
}
