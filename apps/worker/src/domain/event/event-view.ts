import type { InstantMs } from '@scoreboard/protocol/scoring-event'
import type { ServerMessage } from '@scoreboard/protocol/server-message'

import { publicSnapshotFor } from '@scoreboard/core/event/public-snapshot'

import type { Admission } from './admission'
import type { EventStore } from './event-store'

/** The snapshot a socket's role may see, or `null` for an event that was never opened. */
export const snapshotMessageFor = ({
  admission,
  nowMs,
  store
}: {
  admission: Admission
  nowMs: InstantMs
  store: EventStore
}): ServerMessage | null => {
  const setup = store.readSetup()

  if (setup === null) {
    return null
  }

  const logs = store.readLogs()
  const event = publicSnapshotFor({ logs, nowMs, setup })

  switch (admission.role) {
    case 'display':
      return { snapshot: event, type: 'snapshot.display' }
    case 'spectator':
      return { snapshot: event, type: 'snapshot.spectator' }
    case 'organiser':
      return {
        snapshot: {
          event,
          setup,
          tableAccesses: store.readTableAccesses()
        },
        type: 'snapshot.organiser'
      }
    case 'umpire': {
      const matchId =
        event.tables.find((table) => table.number === admission.table)
          ?.matchId ?? null

      return {
        snapshot: {
          event,
          log: (matchId === null ? [] : (logs.get(matchId) ?? [])).map(
            (stamped) => stamped.event
          ),
          table: admission.table
        },
        type: 'snapshot.umpire'
      }
    }
  }
}
