import type { ClubRecord } from '@scoreboard/protocol/club-record'
import { eventErasureAtMs } from '@scoreboard/protocol/event-retention'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'

/** A logo the club's room holds; one stored before its time was kept counts as old. */
export type StoredLogoEntry = {
  logoId: string
  storedAtMs: InstantMs | null
}

/** An event created while the logo was the club's can still show it until that event is erased. */
const isOutlivedByEvents = (storedAtMs: InstantMs | null, nowMs: InstantMs) =>
  storedAtMs === null ||
  nowMs > eventErasureAtMs({ changedAtMs: storedAtMs, startsAtMs: null })

/**
 * The stored logos nothing shows any more: neither the club's record, its
 * own or an opponent's, nor an event young enough to have copied them.
 */
export const logoIdsToDrop = ({
  logoUrlOf,
  nowMs,
  record,
  stored
}: {
  logoUrlOf: (logoId: string) => string
  nowMs: InstantMs
  record: ClubRecord
  stored: readonly StoredLogoEntry[]
}): string[] => {
  const shownUrls = new Set(
    [record.own, ...record.opponents].map((club) => club.logoUrl)
  )

  return stored
    .filter(
      ({ logoId, storedAtMs }) =>
        !shownUrls.has(logoUrlOf(logoId)) &&
        isOutlivedByEvents(storedAtMs, nowMs)
    )
    .map(({ logoId }) => logoId)
}
