import { useState } from 'react'

import type { Credentials } from '@scoreboard/protocol/client-message'
import type {
  RecordRefusal,
  SetupRefusal
} from '@scoreboard/protocol/error-code'
import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type { OrganiserSnapshot } from '@scoreboard/protocol/event-snapshot'
import type {
  EventId,
  MatchId,
  OrganiserCode
} from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'

import { useEventSocket } from '@/infrastructure/messaging/use-event-socket'

/** The organiser's live view of the event, and the two ways they change it. */
export const useOrganiserConsole = ({
  code,
  eventId
}: {
  code: OrganiserCode
  eventId: EventId
}) => {
  const [snapshot, setSnapshot] = useState<OrganiserSnapshot | null>(null)
  const [setupRefusal, setSetupRefusal] = useState<SetupRefusal | null>(null)
  const [recordRefusal, setRecordRefusal] = useState<RecordRefusal | null>(null)
  const credentials: Credentials = { code, role: 'organiser' }

  const socket = useEventSocket({
    credentials,
    eventId,
    onMessage: (message) => {
      switch (message.type) {
        case 'snapshot.organiser':
          setSnapshot(message.snapshot)
          break
        case 'setup.refused':
          setSetupRefusal(message.reason)
          break
        case 'record.refused':
          setRecordRefusal(message.reason)
          break
        default:
          break
      }
    }
  })

  return {
    error: socket.error,
    record: (matchId: MatchId, event: ScoringEvent): boolean => {
      setRecordRefusal(null)

      return socket.send({ event, matchId, type: 'match.record' })
    },
    recordRefusal,
    saveSetup: (setup: EventSetup): boolean => {
      setSetupRefusal(null)

      return socket.send({ setup, type: 'setup.save' })
    },
    setupRefusal,
    snapshot,
    status: socket.status
  }
}
