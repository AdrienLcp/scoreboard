import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import {
  type ChampionshipPool,
  FFTT_STANDINGS_POINTS,
  type FixtureResult
} from '@scoreboard/protocol/championship'
import type { Encounter } from '@scoreboard/protocol/event-setup'

import { encounterFormatFor } from '../encounter/encounter-formats'
import { matchPointsFor } from '../encounter/match-points'
import {
  bergerRounds,
  poolRoundsFor,
  resizedPool,
  roundIndexForDay,
  swappedFixture
} from './championship-calendar'
import { resultChoicesFor, withSheetResults } from './championship-results'
import { poolStandingsFor } from './championship-standings'

const D6 = encounterFormatFor('fftt-6-players-20-games')

const poolOf = (size: number): ChampionshipPool => ({
  division: 'D2',
  id: randomUUID(),
  number: 3,
  phase: 1,
  points: FFTT_STANDINGS_POINTS,
  rounds: poolRoundsFor(size),
  season: 2026,
  teams: Array.from({ length: size }, () => randomUUID())
})

const played = (home: number, away: number): FixtureResult => ({
  forfeit: null,
  score: { away, home }
})

/** Writes a result on the fixture between two numbers, whichever receives. */
const withResult = (
  pool: ChampionshipPool,
  between: readonly [number, number],
  result: FixtureResult
): ChampionshipPool => ({
  ...pool,
  rounds: pool.rounds.map((round) => ({
    ...round,
    fixtures: round.fixtures.map((fixture) =>
      fixture.home === between[0] && fixture.away === between[1]
        ? { ...fixture, result }
        : fixture
    )
  }))
})

const pairsOf = (rounds: ReturnType<typeof bergerRounds>) =>
  rounds.map((round) => round.map(({ away, home }) => `${home}-${away}`))

describe('championship calendar', () => {
  it('draws the federation grid for a pool of eight', () => {
    expect(pairsOf(bergerRounds(8))).toEqual([
      ['1-8', '2-7', '3-6', '4-5'],
      ['8-5', '6-4', '7-3', '1-2'],
      ['2-8', '3-1', '4-7', '5-6'],
      ['8-6', '7-5', '1-4', '2-3'],
      ['3-8', '4-2', '5-1', '6-7'],
      ['8-7', '1-6', '2-5', '3-4'],
      ['4-8', '5-3', '6-2', '7-1']
    ])
  })

  it.each([4, 5, 6, 7, 8, 10, 12])(
    'meets every team once in a pool of %i, each team at most once a round',
    (size) => {
      const rounds = bergerRounds(size)
      const pairs = rounds.flatMap((round) =>
        round.map(({ away, home }) => [home, away].toSorted().join('-'))
      )

      expect(new Set(pairs).size).toBe((size * (size - 1)) / 2)
      expect(pairs).toHaveLength((size * (size - 1)) / 2)

      for (const round of rounds) {
        const numbers = round.flatMap(({ away, home }) => [home, away])
        expect(new Set(numbers).size).toBe(numbers.length)
      }
    }
  )

  it('rests whoever meets the empty seat of an odd pool', () => {
    const rounds = bergerRounds(7)

    expect(rounds).toHaveLength(7)
    expect(rounds.every((round) => round.length === 3)).toBe(true)
  })

  it('keeps dates and the results of pairings still met at another size', () => {
    const pool = withResult(
      {
        ...poolOf(8),
        rounds: poolOf(8).rounds.map((round, index) => ({
          ...round,
          date: `2026-10-${String(index + 10)}`
        }))
      },
      [2, 7],
      played(11, 9)
    )
    const smaller = resizedPool(pool, 7)

    expect(smaller.teams).toHaveLength(7)
    expect(smaller.rounds[0]?.date).toBe('2026-10-10')
    expect(
      smaller.rounds
        .flatMap((round) => round.fixtures)
        .find((fixture) => fixture.home === 2 && fixture.away === 7)?.result
    ).toEqual(played(11, 9))
  })

  it('inverts a fixture with its result following its teams', () => {
    expect(
      swappedFixture({
        away: 8,
        home: 1,
        playedAs: null,
        result: { forfeit: 'away', score: { away: 0, home: 20 } }
      })
    ).toEqual({
      away: 1,
      home: 8,
      playedAs: null,
      result: { forfeit: 'home', score: { away: 20, home: 0 } }
    })
  })

  it('prepares the round of the day, else the next one our team still plays', () => {
    const dates = [
      '2026-09-27',
      '2026-10-11',
      '2026-10-18',
      '2026-11-08',
      '2026-11-22',
      '2026-12-06',
      '2026-12-13'
    ]
    const pool = {
      ...poolOf(8),
      rounds: poolOf(8).rounds.map((round, index) => ({
        ...round,
        date: dates[index] ?? null
      }))
    }
    const ourTeam = pool.teams[0] ?? randomUUID()

    expect(
      roundIndexForDay({ day: '2026-10-18', ownTeamIds: [ourTeam], pool })
    ).toBe(2)
    expect(
      roundIndexForDay({ day: '2026-11-01', ownTeamIds: [ourTeam], pool })
    ).toBe(3)
    expect(
      roundIndexForDay({ day: '2027-01-10', ownTeamIds: [ourTeam], pool })
    ).toBeNull()
  })

  it('keeps a round prepared ahead as the next one until its result stands', () => {
    const pool = poolOf(8)
    const ourTeam = pool.teams[0] ?? randomUUID()
    const prepared = {
      ...pool,
      rounds: pool.rounds.map((round, index) =>
        index === 0
          ? {
              ...round,
              fixtures: round.fixtures.map((fixture) => ({
                ...fixture,
                playedAs: { encounterId: randomUUID(), eventId: 'abcdefghij' }
              }))
            }
          : round
      )
    }
    const finished = {
      ...prepared,
      rounds: prepared.rounds.map((round, index) =>
        index === 0
          ? {
              ...round,
              fixtures: round.fixtures.map((fixture) => ({
                ...fixture,
                result: played(10, 4)
              }))
            }
          : round
      )
    }

    expect(
      roundIndexForDay({
        day: '2026-10-01',
        ownTeamIds: [ourTeam],
        pool: prepared
      })
    ).toBe(0)
    expect(
      roundIndexForDay({
        day: '2026-10-01',
        ownTeamIds: [ourTeam],
        pool: finished
      })
    ).toBe(1)
  })
})

describe('championship results', () => {
  it('offers every score of a 20-match sheet played out, then both forfeits', () => {
    const choices = resultChoicesFor({
      format: D6,
      matchPoints: matchPointsFor('one-per-win')
    })

    expect(choices).toHaveLength(23)
    expect(choices[0]).toEqual(played(20, 0))
    expect(choices[9]).toEqual(played(11, 9))
    expect(choices.at(-2)).toEqual({
      forfeit: 'away',
      score: { away: 0, home: 20 }
    })
  })

  it('writes a finished sheet into its fixture, the right way round', () => {
    const eventId = 'event-1'
    const encounterId = randomUUID()
    const pool = poolOf(8)
    const linked: ChampionshipPool = {
      ...pool,
      rounds: pool.rounds.map((round, index) =>
        index === 1
          ? {
              ...round,
              fixtures: round.fixtures.map((fixture) =>
                fixture.home === 8
                  ? { ...fixture, playedAs: { encounterId, eventId } }
                  : fixture
              )
            }
          : round
      )
    }
    const encounter: Encounter = {
      away: pool.teams[7] ?? randomUUID(),
      formatId: 'fftt-6-players-20-games',
      home: pool.teams[4] ?? randomUUID(),
      id: encounterId,
      matchPoints: 'one-per-win'
    }
    const running = withSheetResults({
      encounters: [encounter],
      eventId,
      pool: linked,
      views: [{ id: encounterId, outcome: null, points: { away: 4, home: 6 } }]
    })
    const finished = withSheetResults({
      encounters: [encounter],
      eventId,
      pool: linked,
      views: [
        { id: encounterId, outcome: 'home', points: { away: 9, home: 11 } }
      ]
    })

    expect(running).toBe(linked)
    expect(
      finished.rounds[1]?.fixtures.find((fixture) => fixture.home === 8)?.result
    ).toEqual(played(9, 11))
  })
})

describe('championship standings', () => {
  it('counts 3 a win, 2 a draw, 1 a loss and nothing for a forfeit', () => {
    const pool = [
      [[1, 8], played(11, 9)],
      [[2, 7], played(10, 10)],
      [[3, 6], { forfeit: 'away', score: { away: 0, home: 20 } }]
    ] as const
    const standings = pool.reduce(
      (current, [between, result]) => withResult(current, between, result),
      poolOf(8)
    )
    const rows = poolStandingsFor(standings)
    const row = (number: number) => rows.find((line) => line.number === number)

    expect(row(1)).toMatchObject({ played: 1, points: 3, won: 1 })
    expect(row(8)).toMatchObject({ lost: 1, points: 1 })
    expect(row(2)).toMatchObject({ drawn: 1, points: 2 })
    expect(row(6)).toMatchObject({ forfeited: 1, points: 0 })
    expect(row(4)).toMatchObject({ played: 0, points: 0 })
    expect(rows.map((line) => line.number).slice(0, 2)).toEqual([3, 1])
  })

  it('parts two level teams by the encounter between them', () => {
    const results = [
      [[1, 8], played(11, 9)],
      [[8, 5], played(12, 8)],
      [[1, 2], played(8, 12)],
      [[2, 8], played(8, 12)]
    ] as const
    const rows = poolStandingsFor(
      results.reduce(
        (current, [between, result]) => withResult(current, between, result),
        poolOf(8)
      )
    )

    expect(rows.slice(0, 3).map((line) => [line.number, line.rank])).toEqual([
      [8, 1],
      [2, 2],
      [1, 3]
    ])
  })

  it('leaves teams nothing parts level, sharing their rank', () => {
    const rows = poolStandingsFor(poolOf(8))

    expect(rows.every((line) => line.rank === 1)).toBe(true)
    expect(rows.map((line) => line.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })
})
