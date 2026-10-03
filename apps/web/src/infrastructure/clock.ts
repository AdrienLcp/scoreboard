import type { InstantMs } from '@scoreboard/protocol/scoring-event'

/** This device's clock, in epoch milliseconds: the one place the app reads the time. */
export const nowMs = (): InstantMs => Date.now()
