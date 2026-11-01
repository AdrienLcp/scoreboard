import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { EventSetup, MatchSetup } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { PlayerId } from '@scoreboard/protocol/identifiers'
import { scheduledMatchState } from '@scoreboard/protocol/match-state'
import type { Score } from '@scoreboard/protocol/side'
import { setupWith } from '@scoreboard/protocol/testing/event-setups'
import { BEST_OF_5 } from '@scoreboard/protocol/testing/match-formats'
import type { Pool, Tournament } from '@scoreboard/protocol/tournament'

import { withBracketPlayers } from './bracket'
import { seededPools } from './pool-seeding'
import { poolTableFor } from './pool-standings'
import { roundRobinRounds } from './round-robin'
import { isTournamentConsistent } from './tournament-check'
import { tournamentMatchesFor } from './tournament-setup'

const LABELS = {
  final: 'Final',
  poolMatch: (pool: Pool, home: number, away: number) =>
    `${pool.name} ${home}-${away}`,
  semiFinal: (slot: 1 | 2) => `Semi-final ${slot}`,
  thirdPlace: 'Third place'
}

const RULES = { drawOrder: [], lossPoints: 1, winPoints: 2 }

const poolOf = (name: string, size: number): Pool => ({
  id: name,
  name,
  playerIds: Array.from({ length: size }, () => randomUUID())
})

const matchesOf = (
  pools: readonly Pool[],
  hasThirdPlace = false
): MatchSetup[] =>
  tournamentMatchesFor({
    firstTable: 1,
    format: BEST_OF_5,
    hasThirdPlace,
    labels: LABELS,
    newMatchId: randomUUID,
    pools
  })

const viewOf = (setup: MatchSetup): MatchView => ({
  ...setup,
  state: scheduledMatchState,
  timing: {
    durationMs: null,
    estimatedStartMs: null,
    finishedAtMs: null,
    lastTimeout: null,
    startedAtMs: null
  }
})

const swapped = (games: readonly Score[]): Score[] =>
  games.map(({ away, home }) => ({ away: home, home: away }))

/** The match played out game by game, won by whoever won more games. */
const played = (match: MatchView, games: readonly Score[]): MatchView => {
  const periodsWon = {
    away: games.filter((game) => game.away > game.home).length,
    home: games.filter((game) => game.home > game.away).length
  }

  return {
    ...match,
    state: {
      ...scheduledMatchState,
      periods: [...games],
      periodsWon,
      status: 'finished',
      winner: periodsWon.home > periodsWon.away ? 'home' : 'away'
    }
  }
}

const HOME_3_0: Score[] = [
  { away: 5, home: 11 },
  { away: 5, home: 11 },
  { away: 5, home: 11 }
]
const HOME_3_2: Score[] = [
  { away: 5, home: 11 },
  { away: 11, home: 5 },
  { away: 5, home: 11 },
  { away: 11, home: 5 },
  { away: 5, home: 11 }
]

const involves = (match: MatchView, playerId: PlayerId): boolean =>
  match.home.playerIds.includes(playerId) ||
  match.away.playerIds.includes(playerId)

/** Each listed match won by its first player with those games, seen from him. */
const playedAs = (
  matches: readonly MatchView[],
  results: readonly (readonly [PlayerId, PlayerId, Score[]])[]
): MatchView[] =>
  matches.map((match) => {
    const result = results.find(
      ([winner, loser]) => involves(match, winner) && involves(match, loser)
    )

    if (result === undefined) {
      return match
    }

    const [winner, , games] = result

    return played(
      match,
      match.home.playerIds.includes(winner) ? games : swapped(games)
    )
  })

describe('round robin', () => {
  it('plays the clubs’ fixed order for a pool of six', () => {
    expect(roundRobinRounds(6)[0]).toEqual([
      [1, 6],
      [2, 5],
      [3, 4]
    ])
    expect(roundRobinRounds(6).at(-1)).toEqual([
      [1, 2],
      [3, 6],
      [4, 5]
    ])
  })

  it.each([3, 4, 5, 6, 7])('meets every pair once in a pool of %i', (size) => {
    const pairs = roundRobinRounds(size)
      .flat()
      .map(([home, away]) => `${home}-${away}`)

    expect(new Set(pairs).size).toBe(pairs.length)
    expect(pairs).toHaveLength((size * (size - 1)) / 2)
  })
})

describe('seeded pools', () => {
  it('alternates the seeds and never seats two players of a club in one pool', () => {
    const clubs = Array.from({ length: 6 }, () => randomUUID())
    const entrants = clubs.flatMap((clubId, index) => [
      { clubId, id: randomUUID(), points: 2000 - index * 10 },
      { clubId, id: randomUUID(), points: 1500 - index * 10 }
    ])
    const pools = seededPools({ entrants, poolCount: 2 })
    const clubOf = (playerId: PlayerId) =>
      entrants.find((entrant) => entrant.id === playerId)?.clubId

    expect(pools.map((pool) => pool.length)).toEqual([6, 6])
    for (const pool of pools) {
      expect(new Set(pool.map(clubOf)).size).toBe(6)
    }
    expect(pools[0]?.[0]).toBe(entrants[0]?.id)
    expect(pools[1]?.[0]).toBe(entrants[2]?.id)
  })
})

describe('tournament matches', () => {
  const pools = [poolOf('A', 6), poolOf('B', 6)]
  const matches = matchesOf(pools)

  it('makes 30 pool matches on six tables, then two semi-finals and a final', () => {
    expect(matches).toHaveLength(33)
    expect(new Set(matches.map((match) => match.table))).toEqual(
      new Set([1, 2, 3, 4, 5, 6])
    )
    expect(matches.slice(-3).map((match) => match.stage?.kind)).toEqual([
      'semi-final',
      'semi-final',
      'final'
    ])
  })

  it('opens pool B with its players 1 and 6 on table 4', () => {
    const first = matches.find((match) => match.table === 4)

    expect(first?.label).toBe('B 1-6')
    expect(first?.home.playerIds).toEqual([pools[1]?.playerIds[0]])
    expect(first?.away.playerIds).toEqual([pools[1]?.playerIds[5]])
  })

  it('adds a third-place match when asked', () => {
    expect(matchesOf(pools, true)).toHaveLength(34)
  })
})

describe('pool table', () => {
  const pool = poolOf('A', 3)
  const [one = '', two = '', three = ''] = pool.playerIds
  const poolMatches = matchesOf([pool, poolOf('B', 2)])
    .filter(
      (match) => match.stage?.kind === 'pool' && match.stage.poolId === 'A'
    )
    .map(viewOf)

  it('ranks by points, two per win and one per loss', () => {
    const table = poolTableFor({
      matches: playedAs(poolMatches, [
        [three, one, HOME_3_0],
        [three, two, HOME_3_0],
        [one, two, HOME_3_0]
      ]),
      pool,
      tournament: RULES
    })

    expect(table.isComplete).toBe(true)
    expect(table.standings.map((standing) => standing.playerId)).toEqual([
      three,
      one,
      two
    ])
    expect(table.standings.map((standing) => standing.points)).toEqual([
      4, 3, 2
    ])
  })

  it('parts three players level on wins by their games ratio between them', () => {
    const table = poolTableFor({
      matches: playedAs(poolMatches, [
        [one, two, HOME_3_2],
        [two, three, HOME_3_0],
        [three, one, HOME_3_2]
      ]),
      pool,
      tournament: RULES
    })

    expect(table.standings.map((standing) => standing.playerId)).toEqual([
      two,
      one,
      three
    ])
    expect(table.standings.some((standing) => standing.isDrawn)).toBe(false)
  })

  it('falls back on the organiser’s draw when everything is level', () => {
    const table = poolTableFor({
      matches: playedAs(poolMatches, [
        [one, two, HOME_3_0],
        [two, three, HOME_3_0],
        [three, one, HOME_3_0]
      ]),
      pool,
      tournament: { ...RULES, drawOrder: [three] }
    })

    expect(table.standings[0]?.playerId).toBe(three)
    expect(table.standings.every((standing) => standing.isDrawn)).toBe(true)
    expect(table.drawnGroups).toEqual([[three, one, two]])
  })

  it('names no group to draw when the tie-break parts everyone', () => {
    const table = poolTableFor({
      matches: playedAs(poolMatches, [
        [one, two, HOME_3_2],
        [two, three, HOME_3_0],
        [three, one, HOME_3_2]
      ]),
      pool,
      tournament: RULES
    })

    expect(table.drawnGroups).toEqual([])
  })
})

describe('bracket', () => {
  it('crosses the pools into the semi-finals and sends the winners on', () => {
    const pools = [poolOf('A', 2), poolOf('B', 2)]
    const tournament: Tournament = { ...RULES, pools }
    const poolsPlayed = matchesOf(pools, true)
      .map(viewOf)
      .map((match) =>
        match.stage?.kind === 'pool' ? played(match, HOME_3_0) : match
      )
    const withSemis = withBracketPlayers({ matches: poolsPlayed, tournament })
    const [a1, a2] = pools[0]?.playerIds ?? []
    const [b1, b2] = pools[1]?.playerIds ?? []
    const semiOne = withSemis.find(
      (match) => match.stage?.kind === 'semi-final' && match.stage.slot === 1
    )

    expect(semiOne?.home.playerIds).toEqual([a1])
    expect(semiOne?.away.playerIds).toEqual([b2])

    const done = withBracketPlayers({
      matches: withSemis.map((match) =>
        match.stage?.kind === 'semi-final'
          ? played(match, swapped(HOME_3_0))
          : match
      ),
      tournament
    })
    const final = done.find((match) => match.stage?.kind === 'final')
    const third = done.find((match) => match.stage?.kind === 'third-place')

    expect(final?.home.playerIds).toEqual([b2])
    expect(final?.away.playerIds).toEqual([a2])
    expect(third?.home.playerIds).toEqual([a1])
    expect(third?.away.playerIds).toEqual([b1])
  })

  it('leaves the semi-finals empty while a pool is still playing', () => {
    const pools = [poolOf('A', 2), poolOf('B', 2)]
    const filled = withBracketPlayers({
      matches: matchesOf(pools).map(viewOf),
      tournament: { ...RULES, pools }
    })

    expect(
      filled
        .filter((match) => match.stage?.kind !== 'pool')
        .every((match) => match.home.playerIds.length === 0)
    ).toBe(true)
  })
})

describe('isTournamentConsistent', () => {
  const firstPool = poolOf('Pool 1', 4)
  const secondPool = poolOf('Pool 2', 4)
  const pools = [firstPool, secondPool]
  const players = pools.flatMap((pool) =>
    pool.playerIds.map((id) => ({
      id,
      licence: null,
      name: id,
      points: null,
      teamId: null
    }))
  )
  const tournamentSetup = (overrides: Partial<EventSetup> = {}): EventSetup =>
    setupWith(matchesOf(pools), {
      players,
      tableCount: 8,
      tournament: { ...RULES, pools },
      ...overrides
    })

  it('[tournament] accepts the matches its pools and bracket need', () => {
    expect(isTournamentConsistent(tournamentSetup())).toBe(true)
  })

  it.each([
    [
      'a pool player missing from the players',
      tournamentSetup({ players: players.slice(1) })
    ],
    [
      'a player in both pools',
      tournamentSetup({
        tournament: {
          ...RULES,
          pools: [
            firstPool,
            {
              ...secondPool,
              playerIds: [
                firstPool.playerIds[0] ?? '',
                ...secondPool.playerIds.slice(1)
              ]
            }
          ]
        }
      })
    ],
    [
      'a pool match left out',
      tournamentSetup({ matches: matchesOf(pools).slice(1) })
    ],
    [
      'a final played twice',
      tournamentSetup({
        matches: [...matchesOf(pools), ...matchesOf(pools).slice(-1)]
      })
    ],
    [
      'staged matches without a tournament',
      tournamentSetup({ tournament: null })
    ]
  ])('[tournament] refuses %s', (_, setup) => {
    expect(isTournamentConsistent(setup)).toBe(false)
  })
})
