import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type {
  EncounterView,
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { MatchId } from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'

import { encounterFormatFor } from '../encounter/encounter-formats'
import { scoreEncounter } from '../encounter/encounter-score'
import { describeMatch } from '../match/match-log'
import { matchOnTable, tableNumbers } from './table-queue'

export type MatchLogs = ReadonlyMap<MatchId, readonly ScoringEvent[]>

const NO_EVENTS: readonly ScoringEvent[] = []

export const matchViewsFor = (
  setup: EventSetup,
  logs: MatchLogs
): MatchView[] =>
  setup.matches.map((match) => ({
    ...match,
    state: describeMatch(match.format, logs.get(match.id) ?? NO_EVENTS)
  }))

/** Everything the room may see, derived from the setup and every match's log. */
export const publicSnapshotFor = (
  setup: EventSetup,
  logs: MatchLogs
): PublicSnapshot => {
  const matches = matchViewsFor(setup, logs)

  const encounterViews = setup.encounters.map(
    (encounter): EncounterView => ({
      id: encounter.id,
      ...scoreEncounter({
        format: encounterFormatFor(encounter.formatId),
        states: matches
          .filter((match) => match.encounterId === encounter.id)
          .map((match) => match.state)
      })
    })
  )

  const queued = matches.map((match) => ({
    id: match.id,
    status: match.state.status,
    table: match.table
  }))

  return {
    club: setup.club,
    defaultFormat: setup.defaultFormat,
    encounters: setup.encounters,
    encounterViews,
    matches,
    name: setup.name,
    players: setup.players,
    tableCount: setup.tableCount,
    tables: tableNumbers(setup.tableCount).map((number) => ({
      matchId: matchOnTable(queued, number),
      number
    })),
    teams: setup.teams
  }
}
