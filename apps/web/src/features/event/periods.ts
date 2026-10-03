import type { Score } from '@scoreboard/protocol/side'

/** A game played, with its place in the match: what a list keys it by. */
export type NumberedPeriod = Score & { number: number }

export const numberedPeriods = (periods: readonly Score[]): NumberedPeriod[] =>
  periods.map((period, position) => ({ ...period, number: position + 1 }))
