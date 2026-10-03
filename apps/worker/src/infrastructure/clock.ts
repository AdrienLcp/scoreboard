import type { InstantMs } from '@scoreboard/protocol/scoring-event'

/** The only reader of the wall clock: the server's time is the one that counts. */
export const nowMs = (): InstantMs => Date.now()
