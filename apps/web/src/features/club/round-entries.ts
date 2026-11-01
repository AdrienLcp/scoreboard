import type {
  ChampionshipPool,
  ChampionshipPoolId,
  Fixture
} from '@scoreboard/protocol/championship'
import type { ClubRecord } from '@scoreboard/protocol/club-record'
import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type {
  EncounterId,
  EventId,
  MatchId,
  TableNumber
} from '@scoreboard/protocol/identifiers'
import type { Side } from '@scoreboard/protocol/side'

import {
  fixtureTeamsOf,
  roundIndexForDay
} from '@scoreboard/core/championship/championship-calendar'
import {
  addClubEncounter,
  type ClubSide,
  defaultTablesFor
} from '@scoreboard/core/club/club-encounter'
import { encounterFormatFor } from '@scoreboard/core/encounter/encounter-formats'

import {
  currentPoolsOf,
  type FixtureAt,
  playedFixture
} from './championship-edits'
import { clubSideOf, isOwnTeam } from './club-teams'

/** One of our encounters on a match day's round, as the calendar gives it. */
export type RoundEntry = {
  at: FixtureAt
  away: ClubSide | null
  date: string | null
  fixture: Fixture
  home: ClubSide | null
  ownSide: Side
  phase: ChampionshipPool['phase']
  poolId: ChampionshipPoolId
}

/**
 * Whether an entry is played in our hall: one of our teams receives, whoever
 * it meets, another of ours included. One received in another club's hall is
 * only said, never added to the day.
 */
export const isPlayedAtHome = (entry: RoundEntry): boolean =>
  entry.ownSide === 'home'

/** Our encounters of the round each current pool prepares on that day, pool after pool. */
export const roundEntriesOf = (
  record: ClubRecord,
  day: string
): RoundEntry[] => {
  const ownTeamIds = record.own.teams.map((team) => team.id)

  return currentPoolsOf(record).flatMap((pool) => {
    const roundIndex = roundIndexForDay({ day, ownTeamIds, pool })
    const round = roundIndex === null ? undefined : pool.rounds[roundIndex]

    if (roundIndex === null || round === undefined) {
      return []
    }

    return round.fixtures.flatMap((fixture, fixtureIndex): RoundEntry[] => {
      const teams = fixtureTeamsOf(pool, fixture)
      const ownSide: Side | null = isOwnTeam(record, teams.home)
        ? 'home'
        : isOwnTeam(record, teams.away)
          ? 'away'
          : null

      return ownSide === null
        ? []
        : [
            {
              at: { fixtureIndex, roundIndex },
              away: clubSideOf(record, teams.away),
              date: round.date,
              fixture,
              home: clubSideOf(record, teams.home),
              ownSide,
              phase: pool.phase,
              poolId: pool.id
            }
          ]
    })
  })
}

/** A round entry brought into the day as its own encounter, on these tables. */
export type PlacedEntry = {
  encounterId: EncounterId
  entry: RoundEntry
  tables: TableNumber[]
}

export type PlacedEntries = {
  placed: PlacedEntry[]
  setup: EventSetup
}

/**
 * The day with these encounters added in turn, each on the tables the ones
 * before it left free, its teams arriving with their last composition; an
 * entry played in another club's hall, or whose opponent nobody holds yet,
 * is left out.
 */
export const placeEntries = ({
  entries,
  newEncounterId,
  newMatchId,
  setup
}: {
  entries: readonly RoundEntry[]
  newEncounterId: () => EncounterId
  newMatchId: () => MatchId
  setup: EventSetup
}): PlacedEntries =>
  entries.reduce<PlacedEntries>(
    (current, entry) => {
      if (
        !isPlayedAtHome(entry) ||
        entry.home === null ||
        entry.away === null
      ) {
        return current
      }

      const encounterId = newEncounterId()
      const tables = defaultTablesFor({
        format: encounterFormatFor(entry.home.team.formatId),
        preferred: entry.home.team.tables,
        setup: current.setup
      })

      return {
        placed: [...current.placed, { encounterId, entry, tables }],
        setup: addClubEncounter({
          away: entry.away,
          awayColour: entry.away.team.colour,
          encounterId,
          home: entry.home,
          newMatchId,
          setup: current.setup,
          tables
        })
      }
    },
    { placed: [], setup }
  )

/** Each placed entry's fixture now followed by its encounter in that event: its sheet will write the result. */
export const withPlayedEntries = ({
  eventId,
  placed,
  record
}: {
  eventId: EventId
  placed: readonly PlacedEntry[]
  record: ClubRecord
}): ClubRecord =>
  placed.reduce(
    (current, { encounterId, entry }) =>
      playedFixture({
        at: entry.at,
        playedAs: { encounterId, eventId },
        poolId: entry.poolId,
        record: current
      }),
    record
  )
