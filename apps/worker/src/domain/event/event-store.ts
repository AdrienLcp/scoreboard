import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type { TableAccess } from '@scoreboard/protocol/event-snapshot'
import type { MatchId, OrganiserCode } from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'

import type { MatchLogs } from '@scoreboard/core/event/public-snapshot'

/** What the event's Durable Object keeps. Synchronous: the object's SQLite storage is. */
export type EventStore = {
  appendScoringEvent: (matchId: MatchId, event: ScoringEvent) => void
  readLogs: () => MatchLogs
  readOrganiserCode: () => OrganiserCode | null
  readSetup: () => EventSetup | null
  readTableAccesses: () => TableAccess[]
  writeOrganiserCode: (code: OrganiserCode) => void
  writeSetup: (setup: EventSetup) => void
  writeTableAccesses: (accesses: readonly TableAccess[]) => void
}
