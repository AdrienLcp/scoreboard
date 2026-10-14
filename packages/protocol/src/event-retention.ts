/**
 * How long an event outlives its last change before the server erases it,
 * names and scores included. An event is played in a day; a month leaves the
 * club time to copy its results, and the legal page states the same figure.
 */
export const EVENT_RETENTION_DAYS = 30

const DAY_MS = 86_400_000

/** When an event last changed at `changedAtMs` is erased. */
export const eventErasureAtMs = (changedAtMs: number): number =>
  changedAtMs + EVENT_RETENTION_DAYS * DAY_MS
