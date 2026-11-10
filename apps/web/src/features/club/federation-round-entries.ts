import type { ChampionshipPool } from '@scoreboard/protocol/championship'
import type {
  ClubRecord,
  DirectoryClub,
  DirectoryTeam
} from '@scoreboard/protocol/club-record'
import { encounterFormatIds } from '@scoreboard/protocol/encounter-format-id'
import type {
  FederationClubNumber,
  FederationFixture,
  FederationPool,
  FederationRound
} from '@scoreboard/protocol/federation'
import { DEFAULT_MATCH_POINTS_RULE } from '@scoreboard/protocol/match-points-rule'
import type { Side } from '@scoreboard/protocol/side'

import { fixtureTeamsOf } from '@scoreboard/core/championship/championship-calendar'
import type { ClubSide } from '@scoreboard/core/club/club-encounter'

import { isWithinDaysOf } from '@/infrastructure/dates'

import { isClubOfTeamName } from './club-edits'
import { clubNameOfTeam } from './directory-search'
import {
  fixtureLabelAsName,
  isRoundAhead,
  ROUND_WEEKEND_DAYS,
  teamNumberOf
} from './federation-season'
import type { KeptFixture, RoundEntry } from './round-entries'

const isOurClub = (
  record: ClubRecord,
  clubNumber: FederationClubNumber | null
): boolean => clubNumber !== null && clubNumber === record.own.number

const ourSidesOf = (record: ClubRecord, fixture: FederationFixture): Side[] => [
  ...(isOurClub(record, fixture.homeClubNumber) ? ['home' as const] : []),
  ...(isOurClub(record, fixture.awayClubNumber) ? ['away' as const] : [])
]

const isOursToPlay = (record: ClubRecord, fixture: FederationFixture) =>
  ourSidesOf(record, fixture).length > 0 && fixture.homeScore === null

/**
 * The FFTT round a match day prepares, as the hand-kept calendar picks it:
 * the one played that weekend, otherwise the first one not yet past where
 * one of our teams has an encounter the FFTT has not scored.
 */
export const federationRoundForDay = ({
  day,
  pool,
  record
}: {
  day: string
  pool: FederationPool
  record: ClubRecord
}): FederationRound | null =>
  pool.rounds.find(
    (round) =>
      round.date !== null &&
      isWithinDaysOf({ day, days: ROUND_WEEKEND_DAYS, of: round.date }) &&
      round.fixtures.some((fixture) => ourSidesOf(record, fixture).length > 0)
  ) ??
  pool.rounds.find(
    (round) =>
      isRoundAhead(round.date, day) &&
      round.fixtures.some((fixture) => isOursToPlay(record, fixture))
  ) ??
  null

/** Our team the FFTT names "PPC ANGLES (2)": the one of ours ending in the same number, the pool's first. */
const ownTeamOf = (
  record: ClubRecord,
  pool: ChampionshipPool,
  label: string
): DirectoryTeam | null => {
  const number = teamNumberOf(label)
  const withNumber = record.own.teams.filter(
    (team) => teamNumberOf(team.name) === number
  )

  return (
    withNumber.find((team) => pool.teams.includes(team.id)) ??
    withNumber.at(0) ??
    null
  )
}

/** FNV-1a: a short stable hash, so an opponent only the FFTT names keeps one id from render to render. */
const hashOf = (text: string): string => {
  let hash = 0x81_1c_9d_c5

  for (const character of text) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, 0x01_00_01_93)
  }

  return (hash >>> 0).toString(16).padStart(12, '0')
}

/** A version-4 shaped id derived from the FFTT's names: the same opponent gets the same one. */
const federationIdOf = (variant: '8' | '9', key: string) =>
  `00000000-0000-4000-${variant}000-${hashOf(key)}`

/**
 * An opponent the directory does not hold, standing in the day only: named
 * as the FFTT names it, in the opponents' colour and our team's format.
 * Nothing of it is written to the club record.
 */
const eventOnlySideOf = ({
  club,
  clubNumber,
  name,
  own,
  record
}: {
  club: DirectoryClub | undefined
  clubNumber: FederationClubNumber | null
  name: string
  own: DirectoryTeam | null
  record: ClubRecord
}): ClubSide => {
  const key = `${clubNumber ?? ''}:${name}`
  const team: DirectoryTeam = {
    colour: record.opponentColour,
    division: null,
    formatId:
      own?.formatId ??
      record.own.teams.at(0)?.formatId ??
      encounterFormatIds[0],
    id: federationIdOf('8', key),
    lineup: [],
    matchPoints: DEFAULT_MATCH_POINTS_RULE,
    name,
    tables: []
  }

  return {
    club: club ?? {
      id: federationIdOf('9', clubNumber ?? clubNameOfTeam(name)),
      logoUrl: null,
      name: clubNameOfTeam(name),
      number: clubNumber,
      players: [],
      teams: [team]
    },
    team
  }
}

/**
 * The opponent the FFTT names, as the directory holds it: the team ending in
 * the same number of the club tied to its FFTT number, else of the club the
 * typed-team rule finds by name, else a team standing in the day only.
 */
const opponentSideOf = ({
  clubNumber,
  label,
  own,
  record
}: {
  clubNumber: FederationClubNumber | null
  label: string
  own: DirectoryTeam | null
  record: ClubRecord
}): ClubSide => {
  const name = fixtureLabelAsName(label)
  const number = teamNumberOf(name)
  const clubName = clubNameOfTeam(name)
  const tied = record.opponents.find(
    (club) => clubNumber !== null && club.number === clubNumber
  )
  const named = record.opponents.find((club) =>
    isClubOfTeamName(club, clubName)
  )

  for (const club of [tied, named]) {
    const team = club?.teams.find(
      (candidate) => teamNumberOf(candidate.name) === number
    )

    if (club !== undefined && team !== undefined) {
      return { club, team }
    }
  }

  return eventOnlySideOf({
    club: tied ?? named,
    clubNumber,
    name,
    own,
    record
  })
}

/** The hand-kept pool's fixture of our team that round: where the sheet's result goes. */
const keptFixtureOf = (
  pool: ChampionshipPool,
  roundNumber: number,
  own: DirectoryTeam | null
): KeptFixture | null => {
  const roundIndex = roundNumber - 1
  const fixtures = pool.rounds[roundIndex]?.fixtures ?? []
  const fixtureIndex =
    own === null
      ? -1
      : fixtures.findIndex((fixture) => {
          const teams = fixtureTeamsOf(pool, fixture)

          return teams.home === own.id || teams.away === own.id
        })
  const fixture = fixtures[fixtureIndex]

  return fixture === undefined
    ? null
    : { at: { fixtureIndex, roundIndex }, fixture }
}

/**
 * Our encounters of the day's round as the FFTT's calendar gives them: who we
 * meet and in which hall, read live and kept nowhere; each one still tied to
 * the hand-kept pool's fixture its result goes back to.
 */
export const federationEntriesOf = ({
  day,
  federationPool,
  pool,
  record
}: {
  day: string
  federationPool: FederationPool
  pool: ChampionshipPool
  record: ClubRecord
}): RoundEntry[] => {
  const round = federationRoundForDay({ day, pool: federationPool, record })

  if (round === null) {
    return []
  }

  return round.fixtures.flatMap((fixture): RoundEntry[] => {
    const [ownSide] = ourSidesOf(record, fixture)

    if (ownSide === undefined) {
      return []
    }

    const ownLabel = ownSide === 'home' ? fixture.homeTeam : fixture.awayTeam
    const ownTeam = ownTeamOf(record, pool, ownLabel)
    const own: ClubSide | null =
      ownTeam === null ? null : { club: record.own, team: ownTeam }
    const sideOf = (side: Side): ClubSide | null => {
      const label = side === 'home' ? fixture.homeTeam : fixture.awayTeam
      const clubNumber =
        side === 'home' ? fixture.homeClubNumber : fixture.awayClubNumber

      if (side === ownSide) {
        return own
      }

      if (isOurClub(record, clubNumber)) {
        const team = ownTeamOf(record, pool, label)

        return team === null ? null : { club: record.own, team }
      }

      return opponentSideOf({ clubNumber, label, own: ownTeam, record })
    }
    const ownNumber = ownTeam === null ? 0 : pool.teams.indexOf(ownTeam.id) + 1

    return [
      {
        away: sideOf('away'),
        date: round.date,
        home: sideOf('home'),
        isFromFederation: true,
        kept: keptFixtureOf(pool, round.number, ownTeam),
        ownNumber: ownNumber === 0 ? null : ownNumber,
        ownSide,
        phase: pool.phase,
        poolId: pool.id,
        roundNumber: round.number
      }
    ]
  })
}
