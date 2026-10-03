import { useState } from 'react'

import type { Credentials } from '@scoreboard/protocol/client-message'
import type { PublicSnapshot } from '@scoreboard/protocol/event-snapshot'
import type { EventId } from '@scoreboard/protocol/identifiers'

import { useEventSocket } from '@/infrastructure/messaging/use-event-socket'

const DISPLAY_CREDENTIALS: Credentials = { role: 'display' }

/** The event as the room sees it, kept live. */
export const useDisplayFeed = (eventId: EventId) => {
  const [snapshot, setSnapshot] = useState<PublicSnapshot | null>(null)

  const socket = useEventSocket({
    credentials: DISPLAY_CREDENTIALS,
    eventId,
    onMessage: (message) => {
      if (message.type === 'snapshot.display') {
        setSnapshot(message.snapshot)
      }
    }
  })

  return { error: socket.error, snapshot, status: socket.status }
}
