import type { ServerMessage } from '@scoreboard/protocol/server-message'

import { publicSnapshotFor } from '@scoreboard/core/event/public-snapshot'

import type { Admission } from './admission'
import type { EventStore } from './event-store'

/** The snapshot a socket's role may see, or `null` for an event that was never opened. */
export const snapshotMessageFor = (
  store: EventStore,
  admission: Admission
): ServerMessage | null => {
  const setup = store.readSetup()

  if (setup === null) {
    return null
  }

  const logs = store.readLogs()
  const event = publicSnapshotFor(setup, logs)

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
          log: matchId === null ? [] : [...(logs.get(matchId) ?? [])],
          table: admission.table
        },
        type: 'snapshot.umpire'
      }
    }
  }
}
