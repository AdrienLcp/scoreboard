import type {
  ChampionshipPool,
  ChampionshipPoolId,
  Fixture,
  PoolNumber
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
import { federationEntriesOf } from './federation-round-entries'
import type { FederationPoolsById } from './use-federation-pools'

/** The hand-kept pool's fixture an entry is: its sheet's result is written there. */
export type KeptFixture = { at: FixtureAt; fixture: Fixture }

/** One of our encounters on a match day's round, as the FFTT's calendar or the hand-kept pool gives it. */
export type RoundEntry = {
  away: ClubSide | null
  date: string | null
  home: ClubSide | null
  /** Read live from the FFTT's calendar, never stored; otherwise from the hand-kept pool. */
  isFromFederation: boolean
  /** `null` when the hand-kept pool's round lacks it: the day plays it, no result goes back. */
  kept: KeptFixture | null
  /** Our team's number in the hand-kept pool, as its calendar names it. */
  ownNumber: PoolNumber | null
  ownSide: Side
  phase: ChampionshipPool['phase']
  poolId: ChampionshipPoolId
  roundNumber: number
}

/**
 * Whether an entry is played in our hall: one of our teams receives, whoever
 * it meets, another of ours included. One received in another club's hall is
 * only said, never added to the day.
 */
export const isPlayedAtHome = (entry: RoundEntry): boolean =>
  entry.ownSide === 'home'

/** Our encounters of the round a hand-kept pool prepares on that day. */
const keptEntriesOf = (
  record: ClubRecord,
  pool: ChampionshipPool,
  day: string
): RoundEntry[] => {
  const ownTeamIds = record.own.teams.map((team) => team.id)
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
            away: clubSideOf(record, teams.away),
            date: round.date,
            home: clubSideOf(record, teams.home),
            isFromFederation: false,
            kept: { at: { fixtureIndex, roundIndex }, fixture },
            ownNumber: ownSide === 'home' ? fixture.home : fixture.away,
            ownSide,
            phase: pool.phase,
            poolId: pool.id,
            roundNumber: roundIndex + 1
          }
        ]
  })
}

const NO_FEDERATION_POOLS: FederationPoolsById = new Map()

/**
 * Our encounters of the round each current pool prepares on that day, pool
 * after pool: from the FFTT's calendar for a pool it answered for, from the
 * hand-kept pool otherwise (FFTT off, down or offline, club not tied, no
 * team of ours there).
 */
export const roundEntriesOf = (
  record: ClubRecord,
  day: string,
  federationPools: FederationPoolsById = NO_FEDERATION_POOLS
): RoundEntry[] =>
  currentPoolsOf(record).flatMap((pool) => {
    const federationPool = federationPools.get(pool.id)

    return federationPool === undefined
      ? keptEntriesOf(record, pool, day)
      : federationEntriesOf({ day, federationPool, pool, record })
  })

/** Whether the day already holds an entry: the encounter its fixture is followed by, or one between the same two teams. */
export const isEntryInTheDay = ({
  entry,
  eventId,
  setup
}: {
  entry: RoundEntry
  eventId: EventId
  setup: EventSetup
}): boolean => {
  const playedAs = entry.kept?.fixture.playedAs

  return setup.encounters.some((encounter) =>
    playedAs?.eventId === eventId
      ? encounter.id === playedAs.encounterId
      : encounter.home === entry.home?.team.id &&
        encounter.away === entry.away?.team.id
  )
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

/** Each placed entry's hand-kept fixture now followed by its encounter in that event: its sheet will write the result. */
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
      entry.kept === null
        ? current
        : playedFixture({
            at: entry.kept.at,
            playedAs: { encounterId, eventId },
            poolId: entry.poolId,
            record: current
          }),
    record
  )
