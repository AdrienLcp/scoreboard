/**
 * How long an event outlives its last change, or its start when that comes
 * later, before the server erases it, names and scores included. An event is
 * played in a day; a month leaves the club time to copy its results, and the
 * legal page states the same figure.
 */
export const EVENT_RETENTION_DAYS = 30

const DAY_MS = 86_400_000

/** When an event is erased: an event prepared months ahead outlives its own date, never less. */
export const eventErasureAtMs = ({
  changedAtMs,
  startsAtMs
}: {
  changedAtMs: number
  startsAtMs: number | null
}): number =>
  Math.max(changedAtMs, startsAtMs ?? changedAtMs) +
  EVENT_RETENTION_DAYS * DAY_MS
