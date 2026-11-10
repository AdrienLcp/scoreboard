import { Result } from '@adrienlcp/result'

import type {
  FederationClubSearch,
  FederationEncounter,
  FederationEncounterReference,
  FederationFixture,
  FederationGame,
  FederationPlayer,
  FederationSheetPlayer
} from '@scoreboard/protocol/federation'

import type { Federation } from '@/domain/federation/federation'

import {
  FAKE_CLUB_POSTCODES,
  FAKE_CLUBS,
  FAKE_DEPARTMENT,
  FAKE_GAMES_PER_ENCOUNTER,
  FAKE_PLAYERS,
  FAKE_POOL,
  FAKE_SHEET_NAMES,
  FAKE_TEAMS
} from './fake-federation-data'

const comparable = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

const clubMatches = (search: FederationClubSearch) => {
  if ('name' in search) {
    const name = comparable(search.name)

    return (club: { name: string }) => comparable(club.name).includes(name)
  }

  if ('number' in search) {
    return (club: { number: string }) => club.number === search.number
  }

  if ('postcode' in search) {
    return (club: { number: string }) =>
      FAKE_CLUB_POSTCODES[club.number] === search.postcode
  }

  return () => search.department === FAKE_DEPARTMENT
}

const sheetNameOf = (player: FederationPlayer) =>
  `${player.lastName.toUpperCase()} ${player.firstName}`

/** The four players a club's sheet lists: its best four when the fake keeps its roster, invented names otherwise. */
const sheetPlayersOf = (
  clubNumber: string | null,
  offset: number
): FederationSheetPlayer[] => {
  const roster = FAKE_PLAYERS.filter(
    (player) => player.clubNumber === clubNumber
  )

  if (roster.length >= 4) {
    return roster.slice(0, 4).map((player) => ({
      name: sheetNameOf(player),
      points: player.points,
      sex: player.sex
    }))
  }

  return [0, 1, 2, 3].map((index) => ({
    name: FAKE_SHEET_NAMES[(offset + index) % FAKE_SHEET_NAMES.length] ?? '',
    points: 1100 - index * 40,
    sex: 'M'
  }))
}

/** Each player's three singles against the other side, then the two doubles in the middle, as on a 14-game sheet. */
const SINGLES: readonly (readonly [number, number])[] = [
  [0, 0],
  [1, 1],
  [2, 2],
  [3, 3],
  [0, 1],
  [1, 0],
  [2, 3],
  [3, 2],
  [0, 2],
  [1, 3],
  [2, 0],
  [3, 1]
]
const DOUBLES_AFTER = 8

const HOME_WON_SETS = [
  { away: 8, home: 11 },
  { away: 11, home: 9 },
  { away: 7, home: 11 },
  { away: 5, home: 11 }
]

/** The home side wins `homeScore` of the games, spread over the sheet. */
const homeWinsGame = (index: number, homeScore: number) =>
  Math.floor(((index + 1) * homeScore) / FAKE_GAMES_PER_ENCOUNTER) >
  Math.floor((index * homeScore) / FAKE_GAMES_PER_ENCOUNTER)

const gameOf = (
  index: number,
  homeScore: number,
  homePlayers: string[],
  awayPlayers: string[]
): FederationGame => {
  const homeWon = homeWinsGame(index, homeScore)

  return {
    awayPlayers,
    awayPoints: homeWon ? 0 : 1,
    homePlayers,
    homePoints: homeWon ? 1 : 0,
    sets: homeWon
      ? HOME_WON_SETS
      : HOME_WON_SETS.map(({ away, home }) => ({ away: home, home: away }))
  }
}

const encounterOf = (
  fixture: FederationFixture
): FederationEncounter | null => {
  if (fixture.homeScore === null || fixture.awayScore === null) {
    return null
  }

  const homeScore = fixture.homeScore
  const home = sheetPlayersOf(fixture.homeClubNumber, 0)
  const away = sheetPlayersOf(fixture.awayClubNumber, 4)
  const nameAt = (players: FederationSheetPlayer[], index: number) =>
    players[index]?.name ?? ''
  const singles = SINGLES.map(([homeIndex, awayIndex]) => [
    [nameAt(home, homeIndex)],
    [nameAt(away, awayIndex)]
  ])
  const doubles = [
    [
      [nameAt(home, 0), nameAt(home, 1)],
      [nameAt(away, 0), nameAt(away, 1)]
    ],
    [
      [nameAt(home, 2), nameAt(home, 3)],
      [nameAt(away, 2), nameAt(away, 3)]
    ]
  ]
  const sheet = [
    ...singles.slice(0, DOUBLES_AFTER),
    ...doubles,
    ...singles.slice(DOUBLES_AFTER)
  ]

  return {
    awayPlayers: away,
    awayScore: fixture.awayScore,
    awayTeam: fixture.awayTeam,
    games: sheet.map(([homePlayers = [], awayPlayers = []], index) =>
      gameOf(index, homeScore, homePlayers, awayPlayers)
    ),
    homePlayers: home,
    homeScore,
    homeTeam: fixture.homeTeam
  }
}

const fixtureOf = (reference: FederationEncounterReference) =>
  FAKE_POOL.rounds
    .flatMap((round) => round.fixtures)
    .find((fixture) => fixture.encounter?.encounterId === reference.encounterId)

const samePool = (
  a: { division: string; pool: string },
  b: { division: string; pool: string }
) => a.division === b.division && a.pool === b.pool

/**
 * The federation as the fixtures of `fake-federation-data.ts` tell it: two
 * clubs with their rosters and teams, one pool of eight with its calendar
 * and its first results. Plugged in by `SMARTPING_FAKE=1`, for local work only.
 */
export const fakeFederation: Federation = {
  clubPlayers: async (club) =>
    Result.success(FAKE_PLAYERS.filter((player) => player.clubNumber === club)),
  clubTeams: async (club) => Result.success([...(FAKE_TEAMS[club] ?? [])]),
  encounter: async (reference) => {
    const fixture = fixtureOf(reference)

    return Result.success(fixture === undefined ? null : encounterOf(fixture))
  },
  player: async (licence) =>
    Result.success(
      FAKE_PLAYERS.find((player) => player.licence === licence) ?? null
    ),
  pool: async (reference) =>
    Result.success(
      samePool(reference, FAKE_POOL.reference)
        ? FAKE_POOL
        : { reference, rounds: [], standings: [] }
    ),
  searchClubs: async (search) =>
    Result.success(FAKE_CLUBS.filter(clubMatches(search))),
  searchPlayers: async ({ firstName, lastName }) =>
    Result.success(
      FAKE_PLAYERS.filter(
        (player) =>
          comparable(player.lastName).startsWith(comparable(lastName)) &&
          (firstName === undefined ||
            comparable(player.firstName).startsWith(comparable(firstName)))
      )
    )
}
