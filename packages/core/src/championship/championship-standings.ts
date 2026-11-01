import type {
  ChampionshipPool,
  Fixture,
  FixtureResult,
  PoolNumber,
  StandingsPoints
} from '@scoreboard/protocol/championship'
import type { TeamId } from '@scoreboard/protocol/identifiers'
import type { Side } from '@scoreboard/protocol/side'

import { opponentOf } from '../match/opponent'
import { wonLostRatio } from '../ranking/won-lost-ratio'

/** How an encounter ended for one of its teams. */
export type FixtureOutcome = 'draw' | 'forfeit' | 'loss' | 'win'

/** A team's line in its pool's standings. */
export type StandingsRow = {
  drawn: number
  forfeited: number
  lost: number
  /** Matches lost over its encounters: the sheets' scores added up. */
  matchesAgainst: number
  matchesFor: number
  number: PoolNumber
  played: number
  points: number
  /** 1 for the leader; teams the tie-break cannot part share theirs. */
  rank: number
  teamId: TeamId | null
  won: number
}

type Decided = Fixture & { result: FixtureResult }

const isDecided = (fixture: Fixture): fixture is Decided =>
  fixture.result !== null

export const outcomeFor = (
  result: FixtureResult,
  side: Side
): FixtureOutcome => {
  if (result.forfeit !== null) {
    return result.forfeit === side ? 'forfeit' : 'win'
  }

  const own = result.score[side]
  const other = result.score[opponentOf(side)]

  if (own === other) {
    return 'draw'
  }

  return own > other ? 'win' : 'loss'
}

const sideOf = (fixture: Fixture, number: PoolNumber): Side | null => {
  if (fixture.home === number) {
    return 'home'
  }

  return fixture.away === number ? 'away' : null
}

type Tally = Omit<StandingsRow, 'number' | 'rank' | 'teamId'>

const tallyOf = ({
  fixtures,
  number,
  points
}: {
  fixtures: readonly Decided[]
  number: PoolNumber
  points: StandingsPoints
}): Tally => {
  const encounters = fixtures.flatMap((fixture) => {
    const side = sideOf(fixture, number)

    return side === null
      ? []
      : [
          {
            against: fixture.result.score[opponentOf(side)],
            for: fixture.result.score[side],
            outcome: outcomeFor(fixture.result, side)
          }
        ]
  })
  const counted = (outcome: FixtureOutcome) =>
    encounters.filter((encounter) => encounter.outcome === outcome).length
  const summed = (value: (encounter: (typeof encounters)[number]) => number) =>
    encounters.reduce((total, encounter) => total + value(encounter), 0)

  return {
    drawn: counted('draw'),
    forfeited: counted('forfeit'),
    lost: counted('loss'),
    matchesAgainst: summed((encounter) => encounter.against),
    matchesFor: summed((encounter) => encounter.for),
    played: encounters.length,
    points: summed((encounter) => points[encounter.outcome]),
    won: counted('win')
  }
}

const compareKeys = (
  left: readonly number[],
  right: readonly number[]
): number => {
  const differing = left.findIndex((value, index) => value !== right[index])

  return differing === -1 ? 0 : (right[differing] ?? 0) - (left[differing] ?? 0)
}

/** Numbers grouped by an equal key, best key first. */
const groupedBy = (
  numbers: readonly PoolNumber[],
  keyOf: (number: PoolNumber) => readonly number[]
): PoolNumber[][] => {
  const groups = new Map<
    string,
    { key: readonly number[]; numbers: PoolNumber[] }
  >()

  for (const number of numbers) {
    const key = keyOf(number)
    const id = key.join('/')
    groups.set(id, {
      key,
      numbers: [...(groups.get(id)?.numbers ?? []), number]
    })
  }

  return [...groups.values()]
    .toSorted((left, right) => compareKeys(left.key, right.key))
    .map((group) => group.numbers)
}

/**
 * Parts teams level on points as the FFTT does: the points, then the ratio of
 * matches, over the encounters between them only, then the ratio of matches
 * over all of theirs, going back to the start for a smaller group still level.
 * What none of it parts stays level.
 */
const breakTie = ({
  fixtures,
  level,
  points
}: {
  fixtures: readonly Decided[]
  level: readonly PoolNumber[]
  points: StandingsPoints
}): PoolNumber[][] => {
  if (level.length === 1) {
    return [[...level]]
  }

  const between = fixtures.filter(
    (fixture) => level.includes(fixture.home) && level.includes(fixture.away)
  )
  const groups = groupedBy(level, (number) => {
    const mutual = tallyOf({ fixtures: between, number, points })
    const overall = tallyOf({ fixtures, number, points })

    return [
      mutual.points,
      wonLostRatio(mutual.matchesFor, mutual.matchesAgainst),
      wonLostRatio(overall.matchesFor, overall.matchesAgainst)
    ]
  })

  if (groups.length === 1) {
    return [[...level]]
  }

  return groups.flatMap((group) => breakTie({ fixtures, level: group, points }))
}

/** The pool's standings from the results known so far, best first, level teams by number. */
export const poolStandingsFor = (pool: ChampionshipPool): StandingsRow[] => {
  const fixtures = pool.rounds.flatMap((round) =>
    round.fixtures.filter(isDecided)
  )
  const numbers = pool.teams.map((_, index) => index + 1)
  const tallies = new Map(
    numbers.map((number) => [
      number,
      tallyOf({ fixtures, number, points: pool.points })
    ])
  )
  const levelGroups = groupedBy(numbers, (number) => [
    tallies.get(number)?.points ?? 0
  ]).flatMap((level) => breakTie({ fixtures, level, points: pool.points }))

  return levelGroups.flatMap((group, groupIndex) => {
    const rank =
      1 +
      levelGroups
        .slice(0, groupIndex)
        .reduce((ahead, before) => ahead + before.length, 0)

    return group
      .toSorted((left, right) => left - right)
      .flatMap((number) => {
        const tally = tallies.get(number)

        return tally === undefined
          ? []
          : [
              {
                ...tally,
                number,
                rank,
                teamId: pool.teams.at(number - 1) ?? null
              }
            ]
      })
  })
}
