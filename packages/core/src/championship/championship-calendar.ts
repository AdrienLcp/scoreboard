import type {
  CalendarDate,
  ChampionshipPool,
  ChampionshipRound,
  Fixture,
  PoolNumber
} from '@scoreboard/protocol/championship'
import type { TeamId } from '@scoreboard/protocol/identifiers'

import { opponentOf } from '../match/opponent'

/** Two pool numbers that meet in a round, the first receiving. */
export type Pairing = { away: PoolNumber; home: PoolNumber }

/**
 * The federation's calendar grid, Berger's tables. Round r: the last number
 * meets the one whose double is r + 1 modulo n − 1, away on odd rounds and at
 * home on even ones; the numbers right after that one receive those mirrored
 * before it. Eight teams: 1–8, 2–7, 3–6, 4–5, then 8–5, 6–4, 7–3, 1–2…
 * An odd pool plays with an empty last seat: whoever meets it rests.
 */
export const bergerRounds = (size: number): Pairing[][] => {
  const seats = size % 2 === 0 ? size : size + 1
  const turning = seats - 1
  const wrap = (number: number): number =>
    ((((number - 1) % turning) + turning) % turning) + 1
  const isPlaying = (pairing: Pairing) =>
    pairing.home <= size && pairing.away <= size

  return Array.from({ length: turning }, (_, index) => {
    const round = index + 1
    const facingLast =
      Array.from({ length: turning }, (_, seat) => seat + 1).find(
        (number) => wrap(number * 2) === wrap(round + 1)
      ) ?? 1
    const lastPairing: Pairing =
      round % 2 === 1
        ? { away: seats, home: facingLast }
        : { away: facingLast, home: seats }
    const mirrored = Array.from(
      { length: seats / 2 - 1 },
      (_, offset): Pairing => ({
        away: wrap(facingLast - offset - 1),
        home: wrap(facingLast + offset + 1)
      })
    )

    return [lastPairing, ...mirrored].filter(isPlaying)
  })
}

const fixtureOf = ({ away, home }: Pairing): Fixture => ({
  away,
  home,
  playedAs: null,
  result: null
})

/** A pool's rounds before anything is known: the grid's fixtures, no date, no result. */
export const poolRoundsFor = (size: number): ChampionshipRound[] =>
  bergerRounds(size).map((pairings) => ({
    date: null,
    fixtures: pairings.map(fixtureOf)
  }))

const pairKey = (fixture: Pairing): string =>
  [fixture.home, fixture.away].toSorted((left, right) => left - right).join('-')

/**
 * The pool at another size: numbers past it leave, the grid is drawn again,
 * and each round keeps its date and each pairing still met keeps its fixture
 * (who receives, its result).
 */
export const resizedPool = (
  pool: ChampionshipPool,
  size: number
): ChampionshipPool => {
  const kept = new Map(
    pool.rounds.flatMap((round) =>
      round.fixtures.map((fixture) => [pairKey(fixture), fixture] as const)
    )
  )

  return {
    ...pool,
    rounds: poolRoundsFor(size).map((round, index) => ({
      date: pool.rounds.at(index)?.date ?? null,
      fixtures: round.fixtures.map(
        (fixture) => kept.get(pairKey(fixture)) ?? fixture
      )
    })),
    teams: Array.from(
      { length: size },
      (_, index) => pool.teams.at(index) ?? null
    )
  }
}

/** The other team receives, as when the federation inverts a fixture; its result follows its teams. */
export const swappedFixture = (fixture: Fixture): Fixture => ({
  ...fixture,
  away: fixture.home,
  home: fixture.away,
  result:
    fixture.result === null
      ? null
      : {
          forfeit:
            fixture.result.forfeit === null
              ? null
              : opponentOf(fixture.result.forfeit),
          score: {
            away: fixture.result.score.home,
            home: fixture.result.score.away
          }
        }
})

/** The pool's teams on each side of a fixture, `null` for a number nobody holds yet. */
export const fixtureTeamsOf = (
  pool: ChampionshipPool,
  fixture: Fixture
): { away: TeamId | null; home: TeamId | null } => ({
  away: pool.teams.at(fixture.away - 1) ?? null,
  home: pool.teams.at(fixture.home - 1) ?? null
})

/**
 * The round a match day prepares: the one dated that day, otherwise the
 * first one not yet past where one of our teams still has its encounter to
 * play, already prepared in an event or not, until its result stands;
 * `null` once the pool is played out.
 */
export const roundIndexForDay = ({
  day,
  ownTeamIds,
  pool
}: {
  day: CalendarDate
  ownTeamIds: readonly TeamId[]
  pool: ChampionshipPool
}): number | null => {
  const dated = pool.rounds.findIndex((round) => round.date === day)

  if (dated !== -1) {
    return dated
  }

  const isOursToPlay = (fixture: Fixture) => {
    const teams = fixtureTeamsOf(pool, fixture)
    const isOurs = [teams.home, teams.away].some(
      (teamId) => teamId !== null && ownTeamIds.includes(teamId)
    )

    return isOurs && fixture.result === null
  }
  const next = pool.rounds.findIndex(
    (round) =>
      (round.date === null || round.date >= day) &&
      round.fixtures.some(isOursToPlay)
  )

  return next === -1 ? null : next
}
