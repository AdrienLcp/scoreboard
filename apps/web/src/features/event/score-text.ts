/** The dash between two figures of a score, with no space around it. */
export const SCORE_DASH = '–'

/** "11–9": two figures of a score, the side read first on the left. */
export const scoreText = (first: number, second: number): string =>
  `${first}${SCORE_DASH}${second}`

/**
 * "Camille – Louis": the two sides of a match. The space before the dash does
 * not break, so a wrap never starts a line with it.
 */
export const versusText = (home: string, away: string): string =>
  `${home} – ${away}`
