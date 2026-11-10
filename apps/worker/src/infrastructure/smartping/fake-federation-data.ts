import type {
  FederationClub,
  FederationFixture,
  FederationPlayer,
  FederationPool,
  FederationPoolReference,
  FederationRound,
  FederationStanding,
  FederationTeam
} from '@scoreboard/protocol/federation'

/**
 * Believable federation data for local work before the FFTT's key arrives,
 * and for the tests. Every person here is invented: names and licences
 * belong to no real licensee. The two clubs' numbers are real, so the web
 * app can be tried on our own club.
 */

export const FAKE_HOME_CLUB: FederationClub = {
  name: 'PING PONG CLUB ANGLOIS',
  number: '12850078'
}

export const FAKE_OPPONENT_CLUB: FederationClub = {
  name: 'LUCON TENNIS DE TABLE',
  number: '12850097'
}

/** The six other clubs of the pool: invented names and numbers. */
const FAKE_POOL_CLUBS: readonly FederationClub[] = [
  { name: 'PONGISTES DU LAY', number: '12859901' },
  { name: 'TT MARAIS POITEVIN', number: '12859902' },
  { name: 'ENTENTE COTE DE LUMIERE', number: '12859903' },
  { name: 'ASTT DU BOCAGE', number: '12859904' },
  { name: 'LA PALUE TT', number: '12859905' },
  { name: 'CPTT GRAND LARGE', number: '12859906' }
]

export const FAKE_CLUBS: readonly FederationClub[] = [
  FAKE_HOME_CLUB,
  FAKE_OPPONENT_CLUB,
  ...FAKE_POOL_CLUBS
]

/** Each fake club's postcode, which the club search reads. */
export const FAKE_CLUB_POSTCODES: Readonly<Record<string, string>> = {
  [FAKE_HOME_CLUB.number]: '85750',
  [FAKE_OPPONENT_CLUB.number]: '85400'
}

export const FAKE_DEPARTMENT = '85'

const FAKE_CATEGORIES = ['V40', 'S', 'J3', 'S', 'V50', 'S'] as const

const rosterOf = (
  club: FederationClub,
  firstLicence: number,
  topPoints: number,
  names: readonly (readonly [string, string, 'F' | 'M'])[]
): FederationPlayer[] =>
  names.map(([lastName, firstName, sex], index) => {
    const points = topPoints - index * 55

    return {
      category: FAKE_CATEGORIES[index % FAKE_CATEGORIES.length] ?? null,
      clubName: club.name,
      clubNumber: club.number,
      firstName,
      lastName,
      licence: String(firstLicence + index),
      monthlyPoints: points + (index % 2 === 0 ? 12 : -8),
      points,
      sex
    }
  })

export const FAKE_HOME_PLAYERS = rosterOf(FAKE_HOME_CLUB, 8599001, 1480, [
  ['BRIANCEAU', 'Mathis', 'M'],
  ['GUILLOTEAU', 'Sébastien', 'M'],
  ['MORINEAU', 'Clara', 'F'],
  ['PACAUD', 'Yohann', 'M'],
  ['RABILLER', 'Théo', 'M'],
  ['CHAIGNEAU', 'Laurent', 'M'],
  ['BOISSINOT', 'Maëlys', 'F'],
  ['TESSONNEAU', 'Gaël', 'M'],
  ['FRADET', 'Nathan', 'M'],
  ['GIRAUDEAU', 'Pascal', 'M'],
  ['MANDIN', 'Elsa', 'F'],
  ['ROBICHON', 'Kylian', 'M']
])

export const FAKE_OPPONENT_PLAYERS = rosterOf(
  FAKE_OPPONENT_CLUB,
  8599101,
  1520,
  [
    ['AUVINET', 'Benoît', 'M'],
    ['BERTHOMÉ', 'Lucas', 'M'],
    ['COUSSEAU', 'Inès', 'F'],
    ['DURANTEAU', 'Hugo', 'M'],
    ['ÉPAUD', 'Florian', 'M'],
    ['GAUDUCHEAU', 'Romane', 'F'],
    ['HERBRETEAU', 'Antoine', 'M'],
    ['JOLLY-MERCERON', 'Damien', 'M'],
    ['LOIZEAU', 'Ethan', 'M'],
    ['NAULLEAU', 'Juliette', 'F'],
    ['POUPEAU', 'Thierry', 'M'],
    ['SORIN', 'Louis', 'M']
  ]
)

export const FAKE_PLAYERS: readonly FederationPlayer[] = [
  ...FAKE_HOME_PLAYERS,
  ...FAKE_OPPONENT_PLAYERS
]

/** The pool both clubs' first teams play in. */
export const FAKE_POOL_REFERENCE: FederationPoolReference = {
  division: '200001',
  organiser: '85',
  pool: '300001'
}

/** The pool our second team plays in, with Luçon's third. */
export const FAKE_SECOND_POOL_REFERENCE: FederationPoolReference = {
  division: '200003',
  organiser: '85',
  pool: '300031'
}

const COMPETITION = 'FED_Championnat de France par Equipes Masculin'

const teamOf = (
  id: string,
  name: string,
  division: string,
  pool: FederationPoolReference | null
): FederationTeam => ({
  competition: COMPETITION,
  division,
  id,
  name,
  phase: 1,
  pool
})

export const FAKE_TEAMS: Readonly<Record<string, readonly FederationTeam[]>> = {
  [FAKE_HOME_CLUB.number]: [
    teamOf(
      '9001',
      'PPC ANGLES 1',
      'D85_DÉPARTEMENTALE_1_Ph1 Poule A',
      FAKE_POOL_REFERENCE
    ),
    teamOf(
      '9002',
      'PPC ANGLES 2',
      'D85_DÉPARTEMENTALE_3_Ph1 Poule C',
      FAKE_SECOND_POOL_REFERENCE
    ),
    teamOf('9003', 'PPC ANGLES 3', 'D85_DÉPARTEMENTALE_4_Ph1 Poule F', null)
  ],
  [FAKE_OPPONENT_CLUB.number]: [
    teamOf(
      '9011',
      'LUCON TT 1',
      'D85_DÉPARTEMENTALE_1_Ph1 Poule A',
      FAKE_POOL_REFERENCE
    ),
    teamOf('9012', 'LUCON TT 2', 'D85_DÉPARTEMENTALE_2_Ph1 Poule B', {
      division: '200002',
      organiser: '85',
      pool: '300022'
    }),
    teamOf(
      '9013',
      'LUCON TT 3',
      'D85_DÉPARTEMENTALE_3_Ph1 Poule C',
      FAKE_SECOND_POOL_REFERENCE
    )
  ]
}

type PoolTeam = {
  club: FederationClub
  id: string
  /** As the pool's fixtures print it: `PPC ANGLES (1)`. */
  label: string
  name: string
}

/** The pool's other teams as the federation shortens their clubs' names. */
const FAKE_POOL_TEAM_NAMES = [
  'PONGISTES LAY',
  'TT MARAIS',
  'ENT. COTE LUMIERE',
  'ASTT BOCAGE',
  'LA PALUE',
  'CPTT GRAND LARGE'
] as const

const poolTeamOf = (
  club: FederationClub,
  id: string,
  short: string,
  number: number
): PoolTeam => ({
  club,
  id,
  label: `${short} (${number})`,
  name: `${short} ${number}`
})

/** The six other clubs' teams numbered `number`, their ids from `firstId`. */
const otherClubsTeams = (number: number, firstId: number) =>
  FAKE_POOL_CLUBS.map((club, index) =>
    poolTeamOf(
      club,
      String(firstId + index),
      FAKE_POOL_TEAM_NAMES[index] ?? club.name,
      number
    )
  )

/** Strongest first: the results follow this order. */
const FIRST_POOL_TEAMS: readonly PoolTeam[] = [
  poolTeamOf(FAKE_OPPONENT_CLUB, '9011', 'LUCON TT', 1),
  poolTeamOf(FAKE_HOME_CLUB, '9001', 'PPC ANGLES', 1),
  ...otherClubsTeams(1, 9021)
]

const SECOND_POOL_OTHERS = otherClubsTeams(2, 9031)

const SECOND_POOL_TEAMS: readonly PoolTeam[] = [
  ...SECOND_POOL_OTHERS.slice(0, 3),
  poolTeamOf(FAKE_HOME_CLUB, '9002', 'PPC ANGLES', 2),
  poolTeamOf(FAKE_OPPONENT_CLUB, '9013', 'LUCON TT', 3),
  ...SECOND_POOL_OTHERS.slice(3)
]

/** Saturdays a fortnight apart; the first four are played. */
const ROUND_DATES = [
  '2026-09-19',
  '2026-10-03',
  '2026-10-17',
  '2026-10-31',
  '2026-11-14',
  '2026-11-28',
  '2026-12-12'
] as const

const PLAYED_ROUNDS = 4

/** Games of the encounter: 12 singles and 2 doubles. */
export const FAKE_GAMES_PER_ENCOUNTER = 14

/** The home score, from the gap in strength: a weaker team takes fewer games. */
const homeScoreOf = (home: number, away: number) =>
  Math.min(
    FAKE_GAMES_PER_ENCOUNTER,
    Math.max(0, 7 + Math.round((away - home) / 2))
  )

/** The round-robin circle: the first team stays, the others turn one seat per round. */
const pairingsOf = (teams: number, round: number): [number, number][] => {
  const others = Array.from({ length: teams - 1 }, (_, index) => index + 1)
  const turned = [
    0,
    ...others.slice(others.length - round),
    ...others.slice(0, others.length - round)
  ]
  const half = turned.length / 2

  return Array.from({ length: half }, (_, index) => {
    const pair: [number, number] = [
      turned[index] ?? 0,
      turned[turned.length - 1 - index] ?? 0
    ]

    return round % 2 === 0 ? pair : [pair[1], pair[0]]
  })
}

type FakePoolSpec = {
  /** The pool's encounter ids count up from it. */
  encounterIdBase: number
  /** A played fixture the FFTT has not scored yet, its sheet still on the way. */
  isUnscored: (roundNumber: number, home: PoolTeam, away: PoolTeam) => boolean
  reference: FederationPoolReference
  teams: readonly PoolTeam[]
}

const fixtureOf = (
  spec: FakePoolSpec,
  round: number,
  index: number,
  [home, away]: [number, number]
): FederationFixture => {
  const homeTeam = spec.teams[home]
  const awayTeam = spec.teams[away]

  if (homeTeam === undefined || awayTeam === undefined) {
    throw new Error('The fake pool has no such team')
  }

  const scored =
    round < PLAYED_ROUNDS && !spec.isUnscored(round + 1, homeTeam, awayTeam)
  const homeScore = scored ? homeScoreOf(home, away) : null
  const awayScore =
    homeScore === null ? null : FAKE_GAMES_PER_ENCOUNTER - homeScore

  return {
    awayClubNumber: awayTeam.club.number,
    awayScore,
    awayTeam: awayTeam.label,
    encounter: {
      awayClubNumber: awayTeam.club.number,
      awayScore: awayScore === null ? '' : String(awayScore),
      awayTeam: awayTeam.label,
      awayTeamId: awayTeam.id,
      encounterId: String(spec.encounterIdBase + round * 10 + index),
      homeClubNumber: homeTeam.club.number,
      homeScore: homeScore === null ? '' : String(homeScore),
      homeTeam: homeTeam.label,
      homeTeamId: homeTeam.id,
      isReturn: '0',
      phase: '1'
    },
    homeClubNumber: homeTeam.club.number,
    homeScore,
    homeTeam: homeTeam.label
  }
}

/** Win 3, draw 2, loss 1: the championship's standings points. */
const standingsPointsOf = (scored: number, conceded: number) =>
  scored > conceded ? 3 : scored === conceded ? 2 : 1

const standingsOf = (
  teams: readonly PoolTeam[],
  rounds: readonly FederationRound[]
): FederationStanding[] => {
  const rows = teams.map((team) => ({
    gamesLost: 0,
    gamesWon: 0,
    played: 0,
    points: 0,
    team
  }))

  for (const fixture of rounds.flatMap((round) => round.fixtures)) {
    if (fixture.homeScore === null || fixture.awayScore === null) {
      continue
    }

    for (const [label, scored, conceded] of [
      [fixture.homeTeam, fixture.homeScore, fixture.awayScore],
      [fixture.awayTeam, fixture.awayScore, fixture.homeScore]
    ] as const) {
      const row = rows.find((candidate) => candidate.team.label === label)

      if (row !== undefined) {
        row.played += 1
        row.points += standingsPointsOf(scored, conceded)
        row.gamesWon += scored
        row.gamesLost += conceded
      }
    }
  }

  return rows
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.gamesWon - b.gamesLost - (a.gamesWon - a.gamesLost)
    )
    .map((row, index) => ({
      clubNumber: row.team.club.number,
      gamesLost: row.gamesLost,
      gamesWon: row.gamesWon,
      played: row.played,
      points: row.points,
      rank: index + 1,
      team: row.team.name,
      teamId: row.team.id
    }))
}

const poolOf = (spec: FakePoolSpec): FederationPool => {
  const rounds = ROUND_DATES.map((date, round) => ({
    date,
    fixtures: pairingsOf(spec.teams.length, round).map((pair, index) =>
      fixtureOf(spec, round, index, pair)
    ),
    number: round + 1
  }))

  return {
    reference: spec.reference,
    rounds,
    standings: standingsOf(spec.teams, rounds)
  }
}

/** The played round whose encounter of our first team the FFTT has not scored yet. */
export const FAKE_UNSCORED_ROUND = 4

const isOurs = (team: PoolTeam) => team.club === FAKE_HOME_CLUB

export const FAKE_POOL: FederationPool = poolOf({
  encounterIdBase: 400_000,
  isUnscored: (roundNumber, home, away) =>
    roundNumber === FAKE_UNSCORED_ROUND && (isOurs(home) || isOurs(away)),
  reference: FAKE_POOL_REFERENCE,
  teams: FIRST_POOL_TEAMS
})

export const FAKE_SECOND_POOL: FederationPool = poolOf({
  encounterIdBase: 410_000,
  isUnscored: () => false,
  reference: FAKE_SECOND_POOL_REFERENCE,
  teams: SECOND_POOL_TEAMS
})

/** The pools the fake fills; any other pool answers empty. */
export const FAKE_POOLS: readonly FederationPool[] = [
  FAKE_POOL,
  FAKE_SECOND_POOL
]

/** Invented sheet names for the clubs the fake keeps no roster of. */
export const FAKE_SHEET_NAMES: readonly string[] = [
  'ARNAUD Kévin',
  'BOUTET Simon',
  'CAILLAUD Rémi',
  'DAVIET Paul',
  'FOUCHER Adam',
  'GRELIER Noé',
  'LIMOUZIN Jules',
  'MERLET Tom'
]
