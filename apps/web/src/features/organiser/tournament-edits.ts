import type { ClubRecord } from '@scoreboard/protocol/club-record'
import type {
  EventSetup,
  MatchSetup,
  Player,
  Team
} from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type {
  MatchId,
  PlayerId,
  TableNumber,
  TeamId
} from '@scoreboard/protocol/identifiers'
import { MAX_TABLES } from '@scoreboard/protocol/identifiers'
import type { TableTennisFormat } from '@scoreboard/protocol/match-format'
import {
  DEFAULT_LOSS_POINTS,
  DEFAULT_WIN_POINTS,
  MAX_POOL_PLAYERS,
  type Pool
} from '@scoreboard/protocol/tournament'

import { nextTeamColour } from '@scoreboard/core/club/team-colours'
import { hallPlanOf, isHiddenIn } from '@scoreboard/core/hall/hall-plan'
import { seededPools } from '@scoreboard/core/tournament/pool-seeding'
import { poolTablesFor } from '@scoreboard/core/tournament/pool-standings'
import {
  type TournamentLabels,
  tablesPerPool,
  tournamentMatchesFor
} from '@scoreboard/core/tournament/tournament-setup'

/** The Top 12: each club sends its two best players. */
export const PLAYERS_PER_CLUB = 2

export const POOL_COUNT = 2

/** Two pools of at least two players each. */
export const MIN_ENTRANTS = 4

/** A club the organiser can enter, with the players he can pick from it. */
export type TournamentClub = {
  /** Its colour on the wall, when the day already gave it one. */
  colour: string | null
  id: TeamId
  logoUrl: string | null
  name: string
  /** Best ranked first. */
  players: Player[]
}

/** What the organiser has chosen so far; nothing is saved until he builds it. */
export type TournamentDraft = {
  bestOf: TableTennisFormat['bestOf']
  clubIds: TeamId[]
  hasThirdPlace: boolean
  lossPoints: number
  playerIds: PlayerId[]
  /** His own pools once he has moved a player; `null` keeps the seeding. */
  pools: PlayerId[][] | null
  winPoints: number
}

const byPointsDescending = (left: Player, right: Player): number =>
  (right.points ?? Number.NEGATIVE_INFINITY) -
  (left.points ?? Number.NEGATIVE_INFINITY)

/**
 * The clubs the day can draw from: the club's directory (its own club first,
 * its own logo on it) when there is one, then any team of the day with
 * players that the directory does not hold.
 */
export const tournamentClubsFor = ({
  record,
  setup
}: {
  record: ClubRecord | null
  setup: EventSetup
}): TournamentClub[] => {
  const teamOf = (id: TeamId): Team | undefined =>
    setup.teams.find((team) => team.id === id)
  const fromDirectory = (
    record === null ? [] : [record.own, ...record.opponents]
  ).map(
    (club, index): TournamentClub => ({
      colour: teamOf(club.id)?.colour ?? null,
      id: club.id,
      logoUrl:
        teamOf(club.id)?.logoUrl ??
        (index === 0 ? (setup.club?.logoUrl ?? null) : null),
      name: club.name,
      players: club.players
        .map(
          (player): Player => ({
            id: player.id,
            licence: player.licence,
            name: `${player.firstName} ${player.lastName}`,
            points: player.points,
            teamId: club.id
          })
        )
        .toSorted(byPointsDescending)
    })
  )
  const known = new Set(fromDirectory.map((club) => club.id))
  const fromTheDay = setup.teams.flatMap((team): TournamentClub[] => {
    const players = setup.players
      .filter((player) => player.teamId === team.id)
      .toSorted(byPointsDescending)

    return known.has(team.id) || players.length === 0
      ? []
      : [
          {
            colour: team.colour,
            id: team.id,
            logoUrl: team.logoUrl ?? null,
            name: team.name,
            players
          }
        ]
  })

  return [...fromDirectory, ...fromTheDay].filter(
    (club) => club.players.length > 0
  )
}

const stagedMatchesOf = (setup: EventSetup): MatchSetup[] =>
  setup.matches.filter((match) => match.stage != null)

/** The day's draft: the saved tournament as it stands, or an empty one with the clubs' rules. */
export const tournamentDraftFor = (setup: EventSetup): TournamentDraft => {
  const { tournament } = setup
  const staged = stagedMatchesOf(setup)
  const format = staged[0]?.format ?? setup.defaultFormat

  if (tournament === null || tournament === undefined) {
    return {
      bestOf: setup.defaultFormat.bestOf,
      clubIds: [],
      hasThirdPlace: false,
      lossPoints: DEFAULT_LOSS_POINTS,
      playerIds: [],
      pools: null,
      winPoints: DEFAULT_WIN_POINTS
    }
  }

  const pools = tournament.pools.map((pool) => [...pool.playerIds])
  const playerIds = pools.flat()
  const clubIds = [
    ...new Set(
      playerIds.flatMap((playerId) => {
        const teamId = setup.players.find(
          (player) => player.id === playerId
        )?.teamId

        return teamId === null || teamId === undefined ? [] : [teamId]
      })
    )
  ]

  return {
    bestOf: format.bestOf,
    clubIds,
    hasThirdPlace: staged.some((match) => match.stage?.kind === 'third-place'),
    lossPoints: tournament.lossPoints,
    playerIds,
    pools,
    winPoints: tournament.winPoints
  }
}

const playerOf = (
  clubs: readonly TournamentClub[],
  playerId: PlayerId
): Player | undefined =>
  clubs.flatMap((club) => club.players).find((player) => player.id === playerId)

/** Picks a club with its best players, or drops it with all of them. */
export const toggleClub = ({
  club,
  draft
}: {
  club: TournamentClub
  draft: TournamentDraft
}): TournamentDraft => {
  const isPicked = draft.clubIds.includes(club.id)
  const clubPlayerIds = new Set(club.players.map((player) => player.id))

  return {
    ...draft,
    clubIds: isPicked
      ? draft.clubIds.filter((id) => id !== club.id)
      : [...draft.clubIds, club.id],
    playerIds: isPicked
      ? draft.playerIds.filter((id) => !clubPlayerIds.has(id))
      : [
          ...draft.playerIds,
          ...club.players.slice(0, PLAYERS_PER_CLUB).map((player) => player.id)
        ],
    pools: null
  }
}

/** Enters a player of a picked club, or takes him out; the pools are seeded again. */
export const togglePlayer = ({
  draft,
  playerId
}: {
  draft: TournamentDraft
  playerId: PlayerId
}): TournamentDraft => ({
  ...draft,
  playerIds: draft.playerIds.includes(playerId)
    ? draft.playerIds.filter((id) => id !== playerId)
    : [...draft.playerIds, playerId],
  pools: null
})

/** The pools as they will be played: the organiser's own, or the seeding without clubmates together. */
export const draftPoolsOf = ({
  clubs,
  draft
}: {
  clubs: readonly TournamentClub[]
  draft: TournamentDraft
}): PlayerId[][] =>
  draft.pools ??
  seededPools({
    entrants: draft.playerIds.flatMap((playerId) => {
      const player = playerOf(clubs, playerId)

      return player === undefined
        ? []
        : [{ clubId: player.teamId, id: player.id, points: player.points }]
    }),
    poolCount: POOL_COUNT
  })

/** Two players change places, in one pool or across both. */
export const swapPoolPlayers = ({
  first,
  pools,
  second
}: {
  first: PlayerId
  pools: readonly PlayerId[][]
  second: PlayerId
}): PlayerId[][] =>
  pools.map((pool) =>
    pool.map((playerId) =>
      playerId === first ? second : playerId === second ? first : playerId
    )
  )

/** A pool's players sharing a club: the seeding avoids it, a hand move may not. */
export const hasClubmatesTogether = ({
  clubs,
  pool
}: {
  clubs: readonly TournamentClub[]
  pool: readonly PlayerId[]
}): boolean => {
  const clubIds = pool.map((playerId) => playerOf(clubs, playerId)?.teamId)

  return new Set(clubIds).size !== clubIds.length
}

export const canBuildTournament = (pools: readonly PlayerId[][]): boolean =>
  pools.length === POOL_COUNT &&
  pools.every((pool) => pool.length >= 2 && pool.length <= MAX_POOL_PLAYERS)

/**
 * The tables the pools play on, one run per pool: the tables in use on the
 * hall plan in number order, then new ones past the last if the hall is short.
 */
export const tournamentTablesFor = ({
  pools,
  setup
}: {
  pools: readonly PlayerId[][]
  setup: EventSetup
}): TableNumber[] => {
  const needed = Math.max(
    2,
    pools.reduce(
      (sum, playerIds) => sum + tablesPerPool({ id: '', name: '', playerIds }),
      0
    )
  )
  const plan = hallPlanOf(setup)
  const inUse = plan.tables
    .map((table) => table.table)
    .filter((table) => !isHiddenIn(plan, table))
    .toSorted((left, right) => left - right)
  const extra = Array.from(
    { length: Math.max(0, needed - inUse.length) },
    (_, index) => setup.tableCount + index + 1
  )

  return [...inUse, ...extra]
    .slice(0, needed)
    .filter((table) => table <= MAX_TABLES)
}

/** The day's teams with each picked club added on its own colour: the one it wears, or the next free one. */
export const tournamentTeamsFor = ({
  clubs,
  draft,
  setup
}: {
  clubs: readonly TournamentClub[]
  draft: Pick<TournamentDraft, 'clubIds'>
  setup: EventSetup
}): Team[] => {
  const teams = [...setup.teams]

  for (const clubId of draft.clubIds) {
    const club = clubs.find((candidate) => candidate.id === clubId)

    if (club !== undefined && !teams.some((team) => team.id === club.id)) {
      teams.push({
        colour:
          club.colour ??
          nextTeamColour(teams.flatMap((team) => team.colour ?? [])),
        id: club.id,
        logoUrl: club.logoUrl,
        name: club.name
      })
    }
  }

  return teams
}

const poolIdOf = (index: number): string => `pool-${index + 1}`

/**
 * The day with the tournament built: the clubs as teams with their own
 * colours, the entrants as players, every pool match on its table and the
 * bracket after them, replacing any tournament it had. Other matches stay.
 */
export const withTournament = ({
  clubs,
  draft,
  labels,
  newMatchId,
  poolName,
  setup
}: {
  clubs: readonly TournamentClub[]
  draft: TournamentDraft
  labels: TournamentLabels
  newMatchId: () => MatchId
  poolName: (number: number) => string
  setup: EventSetup
}): EventSetup => {
  const playerIds = draftPoolsOf({ clubs, draft })
  const pools: Pool[] = playerIds.map((poolPlayerIds, index) => ({
    id: poolIdOf(index),
    name: poolName(index + 1),
    playerIds: poolPlayerIds
  }))
  const tables = tournamentTablesFor({ pools: playerIds, setup })
  const teams = tournamentTeamsFor({ clubs, draft, setup })
  const knownPlayerIds = new Set(setup.players.map((player) => player.id))
  const newPlayers = playerIds.flat().flatMap((playerId) => {
    const player = playerOf(clubs, playerId)

    return player === undefined || knownPlayerIds.has(playerId) ? [] : [player]
  })
  const matches = tournamentMatchesFor({
    firstTable: 1,
    format: { ...setup.defaultFormat, bestOf: draft.bestOf },
    hasThirdPlace: draft.hasThirdPlace,
    labels,
    newMatchId,
    pools
  }).map((match) => ({
    ...match,
    table:
      match.table === null ? null : (tables[match.table - 1] ?? match.table)
  }))
  const tableCount = Math.max(
    setup.tableCount,
    ...matches.flatMap((match) => match.table ?? [])
  )

  return {
    ...setup,
    matches: [
      ...setup.matches.filter((match) => match.stage == null),
      ...matches
    ],
    players: [...setup.players, ...newPlayers],
    tableCount,
    teams,
    tournament: {
      drawOrder: setup.tournament?.drawOrder ?? [],
      lossPoints: draft.lossPoints,
      pools,
      winPoints: draft.winPoints
    }
  }
}

/** The day without its tournament: its matches go, the players and clubs stay for another try. */
export const withoutTournament = (setup: EventSetup): EventSetup => ({
  ...setup,
  matches: setup.matches.filter((match) => match.stage == null),
  tournament: null
})

/** Once a tournament match has begun, the pools and rules are what the day plays. */
export const isTournamentUnderWay = (matches: readonly MatchView[]): boolean =>
  matches.some(
    (match) => match.stage != null && match.state.status !== 'scheduled'
  )

/** The players the tie-break leaves level once their pool is over: before, a level table is only a table under way. */
export const drawnPlayersOf = ({
  matches,
  setup
}: {
  matches: readonly MatchView[]
  setup: EventSetup
}): PlayerId[] =>
  setup.tournament === null || setup.tournament === undefined
    ? []
    : poolTablesFor({ matches, tournament: setup.tournament }).flatMap(
        (table) =>
          (table.isComplete ? table.standings : [])
            .filter((standing) => standing.isDrawn)
            .map((standing) => standing.playerId)
      )

/** The draw for the level players, as a tap gives it: a fresh random order, written into the tournament. */
export const withDrawFor = ({
  playerIds,
  random,
  setup
}: {
  playerIds: readonly PlayerId[]
  random: () => number
  setup: EventSetup
}): EventSetup => {
  if (setup.tournament === null || setup.tournament === undefined) {
    return setup
  }

  const shuffled = playerIds
    .map((playerId) => ({ key: random(), playerId }))
    .toSorted((left, right) => left.key - right.key)
    .map(({ playerId }) => playerId)

  return { ...setup, tournament: { ...setup.tournament, drawOrder: shuffled } }
}
