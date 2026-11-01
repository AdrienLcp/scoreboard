import {
  type CalendarDate,
  type ChampionshipPool,
  type ChampionshipPoolId,
  DEFAULT_POOL_SIZE,
  FFTT_STANDINGS_POINTS,
  type Fixture,
  type FixtureEncounter,
  type FixtureResult,
  MAX_POOLS,
  type PoolNumber
} from '@scoreboard/protocol/championship'
import type { ClubRecord } from '@scoreboard/protocol/club-record'
import type { Encounter } from '@scoreboard/protocol/event-setup'
import type { EncounterView } from '@scoreboard/protocol/event-snapshot'
import type { EventId, TeamId } from '@scoreboard/protocol/identifiers'

import {
  poolRoundsFor,
  swappedFixture
} from '@scoreboard/core/championship/championship-calendar'
import { withSheetResults } from '@scoreboard/core/championship/championship-results'

import { dayWeeksAfter } from '@/infrastructure/dates'

export type SeasonPhase = Pick<ChampionshipPool, 'phase' | 'season'>

/** Most calendars space their rounds two weeks apart. */
const ROUND_SPACING_WEEKS = 2

const phaseOrder = (when: SeasonPhase): number => when.season * 2 + when.phase

/** Phase 1 from September; phase 2 from January, its calendar handed out in December. */
const seasonPhaseOn = (day: CalendarDate): SeasonPhase => {
  const year = Number(day.slice(0, 4))
  const month = Number(day.slice(5, 7))

  if (month === 12) {
    return { phase: 2, season: year }
  }

  return month >= 7
    ? { phase: 1, season: year }
    : { phase: 2, season: year - 1 }
}

const phaseAfter = ({ phase, season }: SeasonPhase): SeasonPhase =>
  phase === 1 ? { phase: 2, season } : { phase: 1, season: season + 1 }

/** The pools, the latest phase first, then as the club made them. */
export const poolsLatestFirst = (
  pools: readonly ChampionshipPool[]
): ChampionshipPool[] =>
  pools.toSorted((left, right) => phaseOrder(right) - phaseOrder(left))

/** The pool each of our teams plays in now: its latest one. */
export const currentPoolsOf = (record: ClubRecord): ChampionshipPool[] => {
  const latest = poolsLatestFirst(record.pools)
  const currentIds = new Set(
    record.own.teams.flatMap((team) => {
      const pool = latest.find((candidate) => candidate.teams.includes(team.id))

      return pool === undefined ? [] : [pool.id]
    })
  )

  return latest.filter((pool) => currentIds.has(pool.id))
}

/**
 * A new pool for one of our teams, numbered 1 among eight, for the phase after
 * its last one (or the one the day falls in): the organiser then copies its
 * number, teams and dates from the federation's calendar.
 */
export const addPool = ({
  newPoolId,
  record,
  teamId,
  today
}: {
  newPoolId: () => ChampionshipPoolId
  record: ClubRecord
  teamId: TeamId
  today: CalendarDate
}): ClubRecord => {
  const team = record.own.teams.find((candidate) => candidate.id === teamId)
  const last = poolsLatestFirst(record.pools).find((pool) =>
    pool.teams.includes(teamId)
  )
  const pool: ChampionshipPool = {
    division: team?.division ?? null,
    id: newPoolId(),
    number: null,
    points: FFTT_STANDINGS_POINTS,
    rounds: poolRoundsFor(DEFAULT_POOL_SIZE),
    teams: Array.from({ length: DEFAULT_POOL_SIZE }, (_, index) =>
      index === 0 ? teamId : null
    ),
    ...(last === undefined ? seasonPhaseOn(today) : phaseAfter(last))
  }
  const pools = [...record.pools, pool]

  return {
    ...record,
    pools:
      pools.length > MAX_POOLS
        ? poolsLatestFirst(pools).slice(0, MAX_POOLS)
        : pools
  }
}

export const updatePool = (
  record: ClubRecord,
  pool: ChampionshipPool
): ClubRecord => ({
  ...record,
  pools: record.pools.map((candidate) =>
    candidate.id === pool.id ? pool : candidate
  )
})

export const removePool = (
  record: ClubRecord,
  poolId: ChampionshipPoolId
): ClubRecord => ({
  ...record,
  pools: record.pools.filter((pool) => pool.id !== poolId)
})

/** Puts a team on a number, leaving the number it held before empty. */
export const seatPoolTeam = ({
  number,
  pool,
  teamId
}: {
  number: PoolNumber
  pool: ChampionshipPool
  teamId: TeamId | null
}): ChampionshipPool => ({
  ...pool,
  teams: pool.teams.map((holder, index) => {
    if (index === number - 1) {
      return teamId
    }

    return holder === teamId ? null : holder
  })
})

/** A round's date; the undated rounds after it follow two weeks apart, each one still changeable. */
export const datedRound = ({
  date,
  pool,
  roundIndex
}: {
  date: CalendarDate | null
  pool: ChampionshipPool
  roundIndex: number
}): ChampionshipPool => {
  const dates = pool.rounds.map((round, index) =>
    index === roundIndex ? date : round.date
  )
  const followingDate = (index: number): CalendarDate | null => {
    const since = dates.slice(roundIndex, index)
    const anchorOffset = since.findLastIndex((day) => day !== null)
    const anchor = since[anchorOffset] ?? null

    return anchor === null
      ? null
      : dayWeeksAfter(
          anchor,
          ROUND_SPACING_WEEKS * (since.length - anchorOffset)
        )
  }

  return {
    ...pool,
    rounds: pool.rounds.map((round, index) => {
      const own = dates[index] ?? null
      const isFollowing = index > roundIndex && own === null && date !== null

      return { ...round, date: isFollowing ? followingDate(index) : own }
    })
  }
}

/** Where a fixture stands in its pool: its round, then its place in the round. */
export type FixtureAt = { fixtureIndex: number; roundIndex: number }

const withFixture = ({
  at,
  change,
  pool
}: {
  at: FixtureAt
  change: (fixture: Fixture) => Fixture
  pool: ChampionshipPool
}): ChampionshipPool => ({
  ...pool,
  rounds: pool.rounds.map((round, roundIndex) =>
    roundIndex === at.roundIndex
      ? {
          ...round,
          fixtures: round.fixtures.map((fixture, fixtureIndex) =>
            fixtureIndex === at.fixtureIndex ? change(fixture) : fixture
          )
        }
      : round
  )
})

/** A result picked by hand stands: the fixture stops following the day's sheet. */
export const pickedResult = ({
  at,
  pool,
  result
}: {
  at: FixtureAt
  pool: ChampionshipPool
  result: FixtureResult | null
}): ChampionshipPool =>
  withFixture({
    at,
    change: (fixture) => ({ ...fixture, playedAs: null, result }),
    pool
  })

export const invertedFixture = ({
  at,
  pool
}: {
  at: FixtureAt
  pool: ChampionshipPool
}): ChampionshipPool => withFixture({ at, change: swappedFixture, pool })

/** The encounter created for a fixture on its day: its sheet now writes the fixture's result. */
export const playedFixture = ({
  at,
  playedAs,
  poolId,
  record
}: {
  at: FixtureAt
  playedAs: FixtureEncounter
  poolId: ChampionshipPoolId
  record: ClubRecord
}): ClubRecord => {
  const pool = record.pools.find((candidate) => candidate.id === poolId)

  return pool === undefined
    ? record
    : updatePool(
        record,
        withFixture({
          at,
          change: (fixture) => ({ ...fixture, playedAs }),
          pool
        })
      )
}

/** Every finished sheet of an event written into the fixtures it was played for; the same record when none moved. */
export const withEventSheets = ({
  encounters,
  eventId,
  record,
  views
}: {
  encounters: readonly Encounter[]
  eventId: EventId
  record: ClubRecord
  views: readonly EncounterView[]
}): ClubRecord => {
  const pools = record.pools.map((pool) =>
    withSheetResults({ encounters, eventId, pool, views })
  )

  return pools.every((pool, index) => pool === record.pools[index])
    ? record
    : { ...record, pools }
}
