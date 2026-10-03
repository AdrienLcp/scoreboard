import type { EventSetup, MatchSetup } from '@scoreboard/protocol/event-setup'
import type {
  EncounterView,
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { MatchId } from '@scoreboard/protocol/identifiers'
import type { MatchState } from '@scoreboard/protocol/match-state'
import type {
  InstantMs,
  StampedEvent
} from '@scoreboard/protocol/scoring-event'

import { encounterFormatFor } from '../encounter/encounter-formats'
import { scoreEncounter } from '../encounter/encounter-score'
import { describeMatch } from '../match/match-log'
import { type MatchTimes, matchTimesOf } from '../match/match-times'
import { estimatedDurationMs, type PlayedMatch } from './duration-estimate'
import { estimatedStartsFor } from './start-estimate'
import { matchOnTable, tableNumbers } from './table-queue'

export type MatchLogs = ReadonlyMap<MatchId, readonly StampedEvent[]>

const NO_EVENTS: readonly StampedEvent[] = []

type PlayedSetup = MatchSetup & { state: MatchState; times: MatchTimes }

const playedMatchesOf = (matches: readonly PlayedSetup[]): PlayedMatch[] =>
  matches
    .flatMap(({ format, times }) =>
      times.durationMs === null || times.finishedAtMs === null
        ? []
        : [
            {
              durationMs: times.durationMs,
              finishedAtMs: times.finishedAtMs,
              format
            }
          ]
    )
    .toSorted((left, right) => left.finishedAtMs - right.finishedAtMs)

const matchViewsFor = ({
  logs,
  nowMs,
  setup
}: {
  logs: MatchLogs
  nowMs: InstantMs
  setup: EventSetup
}): MatchView[] => {
  const played = setup.matches.map((match): PlayedSetup => {
    const log = logs.get(match.id) ?? NO_EVENTS
    const state = describeMatch(
      match.format,
      log.map(({ event }) => event)
    )

    return { ...match, state, times: matchTimesOf(log, state) }
  })

  const playedMatches = playedMatchesOf(played)
  const estimates = estimatedStartsFor({
    durationFor: (format) =>
      estimatedDurationMs({ format, played: playedMatches }),
    matches: played.map((match) => ({
      format: match.format,
      id: match.id,
      plannedAtMs: match.plannedAtMs,
      startedAtMs: match.times.startedAtMs,
      status: match.state.status,
      table: match.table
    })),
    nowMs,
    startsAtMs: setup.startsAtMs
  })

  return played.map(({ times, ...match }) => ({
    ...match,
    timing: { ...times, estimatedStartMs: estimates.get(match.id) ?? null }
  }))
}

/** Everything the room may see, derived from the setup, every match's log and the time it is now. */
export const publicSnapshotFor = ({
  logs,
  nowMs,
  setup
}: {
  logs: MatchLogs
  nowMs: InstantMs
  setup: EventSetup
}): PublicSnapshot => {
  const matches = matchViewsFor({ logs, nowMs, setup })

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
    displays: setup.displays,
    encounters: setup.encounters,
    encounterViews,
    generatedAtMs: nowMs,
    matches,
    name: setup.name,
    players: setup.players,
    startsAtMs: setup.startsAtMs,
    tableCount: setup.tableCount,
    tables: tableNumbers(setup.tableCount).map((number) => ({
      matchId: matchOnTable(queued, number),
      number
    })),
    teams: setup.teams
  }
}
