import { useMemo, useState } from 'react'

import type { Credentials } from '@scoreboard/protocol/client-message'
import type { PublicSnapshot } from '@scoreboard/protocol/event-snapshot'
import type { DisplayId, EventId } from '@scoreboard/protocol/identifiers'

import { useEventSocket } from '@/infrastructure/messaging/use-event-socket'

import { isEventGone } from './event-gone'

type ReadOnlyFeed =
  /** A big screen, saying which of the event's screens it shows: `null` for every table. */
  { displayId: DisplayId | null; role: 'display' } | { role: 'spectator' }

/**
 * The event as the room sees it, kept live, for a screen that only watches;
 * gone the moment it is erased. A big screen says which screen it shows, so
 * the organiser sees it connected.
 */
export const usePublicFeed = ({
  eventId,
  ...feed
}: ReadOnlyFeed & { eventId: EventId }) => {
  const [snapshot, setSnapshot] = useState<PublicSnapshot | null>(null)
  const displayId = feed.role === 'display' ? feed.displayId : undefined
  const credentials = useMemo<Credentials>(
    () =>
      displayId === undefined
        ? { role: 'spectator' }
        : { displayId, role: 'display' },
    [displayId]
  )

  const socket = useEventSocket({
    credentials,
    eventId,
    onMessage: (message) => {
      if (
        message.type === 'snapshot.display' ||
        message.type === 'snapshot.spectator'
      ) {
        setSnapshot(message.snapshot)
      }
    }
  })

  return {
    error: socket.error,
    snapshot: isEventGone(socket.error) ? null : snapshot,
    status: socket.status
  }
}
