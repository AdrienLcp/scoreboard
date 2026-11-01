/**
 * How long a club's store outlives its last change before the server erases
 * it: two seasons without a visit means the club no longer uses the app. The
 * legal page states the same figure.
 */
export const CLUB_RETENTION_DAYS = 730

const DAY_MS = 86_400_000

export const clubErasureAtMs = (changedAtMs: number): number =>
  changedAtMs + CLUB_RETENTION_DAYS * DAY_MS
