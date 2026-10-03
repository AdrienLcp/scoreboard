import { useState } from 'react'

import type { Credentials } from '@scoreboard/protocol/client-message'
import type { PublicSnapshot } from '@scoreboard/protocol/event-snapshot'
import type { EventId } from '@scoreboard/protocol/identifiers'

import { useEventSocket } from '@/infrastructure/messaging/use-event-socket'

type ReadOnlyRole = 'display' | 'spectator'

const CREDENTIALS_FOR = {
  display: { role: 'display' },
  spectator: { role: 'spectator' }
} as const satisfies Record<ReadOnlyRole, Credentials>

/** The event as the room sees it, kept live, for a screen that only watches. */
export const usePublicFeed = ({
  eventId,
  role
}: {
  eventId: EventId
  role: ReadOnlyRole
}) => {
  const [snapshot, setSnapshot] = useState<PublicSnapshot | null>(null)

  const socket = useEventSocket({
    credentials: CREDENTIALS_FOR[role],
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

  return { error: socket.error, snapshot, status: socket.status }
}
