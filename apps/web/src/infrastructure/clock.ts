import type { InstantMs } from '@scoreboard/protocol/scoring-event'

/** This device's clock, in epoch milliseconds: the one place the app reads the time. */
export const nowMs = (): InstantMs => Date.now()

/**
 * `Intl` formats a `Date`: this is where an instant becomes one. Here rather
 * than in `dates.ts`, so a screen that only prints a time never downloads the
 * calendar library.
 */
export const toDate = (instant: InstantMs): Date => new Date(instant)
