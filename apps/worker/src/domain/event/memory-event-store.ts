import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type { TableAccess } from '@scoreboard/protocol/event-snapshot'
import type { MatchId, OrganiserCode } from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'

import type { EventStore } from './event-store'

/** An `EventStore` held in memory, for the tests of what sits above storage. */
export const createMemoryEventStore = (): EventStore => {
  let setup: EventSetup | null = null
  let organiserCode: OrganiserCode | null = null
  let accesses: TableAccess[] = []
  const logs = new Map<MatchId, ScoringEvent[]>()

  return {
    appendScoringEvent: (matchId, event) => {
      logs.set(matchId, [...(logs.get(matchId) ?? []), event])
    },
    readLogs: () => new Map(logs),
    readOrganiserCode: () => organiserCode,
    readSetup: () => setup,
    readTableAccesses: () => [...accesses],
    writeOrganiserCode: (code) => {
      organiserCode = code
    },
    writeSetup: (next) => {
      setup = next
    },
    writeTableAccesses: (next) => {
      accesses = [...next]
    }
  }
}
