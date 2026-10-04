import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type {
  EncounterView,
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { MatchId } from '@scoreboard/protocol/identifiers'
import type {
  InstantMs,
  StampedEvent
} from '@scoreboard/protocol/scoring-event'

import { encounterFormatFor } from '../encounter/encounter-formats'
import { scoreEncounter } from '../encounter/encounter-score'
import { describeMatch } from '../match/match-log'
import { matchTimesOf } from '../match/match-times'
import { estimatedDurationMs, type PlayedMatch } from './duration-estimate'
import { estimatedStartsFor } from './start-estimate'
import { matchOnTable, tableNumbers } from './table-queue'

export type MatchLogs = ReadonlyMap<MatchId, readonly StampedEvent[]>

const NO_EVENTS: readonly StampedEvent[] = []

const playedMatchesOf = (matches: readonly MatchView[]): PlayedMatch[] =>
  matches
    .flatMap(({ format, timing }) =>
      timing.durationMs === null || timing.finishedAtMs === null
        ? []
        : [
            {
              durationMs: timing.durationMs,
              finishedAtMs: timing.finishedAtMs,
              format
            }
          ]
    )
    .toSorted((left, right) => left.finishedAtMs - right.finishedAtMs)

const withEstimatedStarts = ({
  matches,
  nowMs,
  startsAtMs
}: {
  matches: readonly MatchView[]
  nowMs: InstantMs
  startsAtMs: InstantMs | null
}): MatchView[] => {
  const playedMatches = playedMatchesOf(matches)
  const estimates = estimatedStartsFor({
    durationFor: (format) =>
      estimatedDurationMs({ format, played: playedMatches }),
    matches: matches.map((match) => ({
      format: match.format,
      id: match.id,
      plannedAtMs: match.plannedAtMs,
      startedAtMs: match.timing.startedAtMs,
      status: match.state.status,
      table: match.table
    })),
    nowMs,
    startsAtMs
  })

  return matches.map((match) => ({
    ...match,
    timing: {
      ...match.timing,
      estimatedStartMs: estimates.get(match.id) ?? null
    }
  }))
}

/**
 * The same snapshot with its expected starts worked out again at `nowMs`: a
 * screen keeps them moving while nobody scores, instead of showing starts
 * that have slipped into the past.
 */
export const withStartsEstimatedAt = (
  snapshot: PublicSnapshot,
  nowMs: InstantMs
): PublicSnapshot => ({
  ...snapshot,
  matches: withEstimatedStarts({
    matches: snapshot.matches,
    nowMs,
    startsAtMs: snapshot.startsAtMs
  })
})

const matchViewsFor = ({
  logs,
  nowMs,
  setup
}: {
  logs: MatchLogs
  nowMs: InstantMs
  setup: EventSetup
}): MatchView[] =>
  withEstimatedStarts({
    matches: setup.matches.map((match): MatchView => {
      const log = logs.get(match.id) ?? NO_EVENTS
      const state = describeMatch(
        match.format,
        log.map(({ event }) => event)
      )

      return {
        ...match,
        state,
        timing: { ...matchTimesOf(log, state), estimatedStartMs: null }
      }
    }),
    nowMs,
    startsAtMs: setup.startsAtMs
  })

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
