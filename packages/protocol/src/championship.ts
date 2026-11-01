import { z } from 'zod'

import { encounterIdSchema, eventIdSchema, teamIdSchema } from './identifiers'
import { scoreSchema, sideSchema } from './side'

/** The federation's pools hold eight teams; a league may run smaller or larger ones. */
export const MIN_POOL_SIZE = 4
export const MAX_POOL_SIZE = 12
export const DEFAULT_POOL_SIZE = 8

/** A club keeps its pools for the two years its store lives: a few teams, two phases a season. */
export const MAX_POOLS = 40

export const SEASON_PHASES = [1, 2] as const

export const championshipPoolIdSchema = z.uuid()
export type ChampionshipPoolId = z.infer<typeof championshipPoolIdSchema>

/** A day as the federation's calendar prints it, with no time of day: "2026-09-27". */
export const calendarDateSchema = z.iso.date()
export type CalendarDate = z.infer<typeof calendarDateSchema>

/** A team's number in its pool, 1-based, as the calendar prints "1 – 8". */
export const poolNumberSchema = z.number().int().min(1).max(MAX_POOL_SIZE)
export type PoolNumber = z.infer<typeof poolNumberSchema>

export const fixtureResultSchema = z.object({
  /** The side that did not come: it earns the forfeit's points, the other wins. */
  forfeit: sideSchema.nullable(),
  /** The encounter's score as its sheet counts it, "11–9"; a forfeit gives the present side every match. */
  score: scoreSchema
})
export type FixtureResult = z.infer<typeof fixtureResultSchema>

/** The encounter the organiser created for a fixture on its day: its sheet writes the fixture's result. */
export const fixtureEncounterSchema = z.object({
  encounterId: encounterIdSchema,
  eventId: eventIdSchema
})
export type FixtureEncounter = z.infer<typeof fixtureEncounterSchema>

export const fixtureSchema = z.object({
  away: poolNumberSchema,
  /** The first team the calendar names receives. */
  home: poolNumberSchema,
  /** Followed until a result is picked by hand, which then stands. */
  playedAs: fixtureEncounterSchema.nullable(),
  result: fixtureResultSchema.nullable()
})
export type Fixture = z.infer<typeof fixtureSchema>

/** A round of the calendar: every team of the pool plays once, all on the same date. */
export const championshipRoundSchema = z.object({
  date: calendarDateSchema.nullable(),
  fixtures: z.array(fixtureSchema).max(MAX_POOL_SIZE / 2)
})
export type ChampionshipRound = z.infer<typeof championshipRoundSchema>

const standingsValueSchema = z.number().int().min(-1).max(5)

/** What an encounter is worth in the pool's standings, by how it ended. */
export const standingsPointsSchema = z.object({
  draw: standingsValueSchema,
  forfeit: standingsValueSchema,
  loss: standingsValueSchema,
  win: standingsValueSchema
})
export type StandingsPoints = z.infer<typeof standingsPointsSchema>

/** The FFTT team championship: 3 a win, 2 a draw, 1 a loss, nothing for a forfeit. */
export const FFTT_STANDINGS_POINTS: StandingsPoints = {
  draw: 2,
  forfeit: 0,
  loss: 1,
  win: 3
}

/**
 * A division's pool for one phase, as the federation's calendar gives it in
 * September or December: its teams by number, one of ours or more among them,
 * and the rounds that make every team meet every other once.
 */
export const championshipPoolSchema = z.object({
  /** "D2", "R3": copied from our team when the pool is made. */
  division: z.string().trim().max(40).nullable(),
  id: championshipPoolIdSchema,
  /** Its number in the division, as the calendar prints it; `null` until known. */
  number: z.number().int().min(1).max(99).nullable(),
  phase: z.union([z.literal(SEASON_PHASES[0]), z.literal(SEASON_PHASES[1])]),
  points: standingsPointsSchema.default(FFTT_STANDINGS_POINTS),
  rounds: z.array(championshipRoundSchema).max(MAX_POOL_SIZE),
  /** The year the season starts: 2026 for 2026–2027. */
  season: z.number().int().min(2000).max(2100),
  /** The pool's teams by number: entry N − 1 is team N, `null` while nobody holds it. */
  teams: z.array(teamIdSchema.nullable()).min(MIN_POOL_SIZE).max(MAX_POOL_SIZE)
})
export type ChampionshipPool = z.infer<typeof championshipPoolSchema>
