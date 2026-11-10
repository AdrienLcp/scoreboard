import { z } from 'zod'

import { calendarDateSchema } from './championship.ts'
import { licenceSchema, rankingPointsSchema } from './licensee.ts'

/**
 * How long the FFTT's data may be kept, in hours: the terms of use of its API
 * (art. 4.2) allow a cache of 24 hours and nothing beyond. The worker's cache
 * and the legal page both read it.
 */
export const FEDERATION_CACHE_HOURS = 24

/** How long a browser keeps an answer of the federation's routes: counted inside the 24 hours, with the worker's own cache. */
export const FEDERATION_BROWSER_CACHE_SECONDS = 60 * 60

/** FFTT club number, 8 digits with its leading zeros: the key a club's data is fetched by. */
export const federationClubNumberSchema = z.string().regex(/^\d{8}$/)
export type FederationClubNumber = z.infer<typeof federationClubNumberSchema>

/** An id the FFTT gives a team, a division, a pool or an encounter: digits, kept as text. */
const federationIdSchema = z.string().regex(/^\d{1,12}$/)

const nameSchema = z.string().trim().min(1).max(120)

export const federationSexSchema = z.enum(['M', 'F'])
export type FederationSex = z.infer<typeof federationSexSchema>

/** A licensee as the federation lists them: never merged with what a club typed (terms of use, art. 4.1). */
export const federationPlayerSchema = z.object({
  /** Age category (`S`, `J3`, `V40`…), when the federation gives one. */
  category: z.string().min(1).max(8).nullable(),
  clubName: z.string().max(120),
  clubNumber: federationClubNumberSchema.nullable(),
  firstName: z.string().max(80),
  lastName: nameSchema,
  licence: licenceSchema,
  /** The month's points, rounded; `null` where the federation gives none or a value off the scale. */
  monthlyPoints: rankingPointsSchema.nullable(),
  /** The phase's official points, the ones printed on a team sheet; `null` for a licensee without a ranking. */
  points: rankingPointsSchema.nullable(),
  sex: federationSexSchema.nullable()
})
export type FederationPlayer = z.infer<typeof federationPlayerSchema>

export const federationClubSchema = z.object({
  name: nameSchema,
  number: federationClubNumberSchema
})
export type FederationClub = z.infer<typeof federationClubSchema>

/** Where a pool's standings and calendar are read: its division, the pool, and the body that organises it. */
export const federationPoolReferenceSchema = z.object({
  division: federationIdSchema,
  organiser: federationIdSchema.optional(),
  pool: federationIdSchema
})
export type FederationPoolReference = z.infer<
  typeof federationPoolReferenceSchema
>

export const federationTeamSchema = z.object({
  /** The competition, e.g. `FED_Championnat de France par Equipes Masculin`. */
  competition: z.string().max(160),
  /** The division and its pool, as the federation labels it. */
  division: z.string().max(160),
  id: federationIdSchema,
  name: nameSchema,
  /** The season's phase the team plays in, 1 or 2, when its label says. */
  phase: z.number().int().min(1).max(2).nullable(),
  /** `null` for a team the federation lists without a pool. */
  pool: federationPoolReferenceSchema.nullable()
})
export type FederationTeam = z.infer<typeof federationTeamSchema>

const teamLabelSchema = z.string().max(120)

/**
 * The key an encounter's detail is read by: the federation's own link,
 * whitelisted field by field, all text so it travels as a query string.
 */
export const federationEncounterReferenceSchema = z.object({
  awayClubNumber: z.union([federationClubNumberSchema, z.literal('')]),
  awayScore: z.string().regex(/^[A-Z0-9]{0,4}$/),
  awayTeam: teamLabelSchema,
  awayTeamId: z.union([federationIdSchema, z.literal('')]),
  encounterId: federationIdSchema,
  homeClubNumber: z.union([federationClubNumberSchema, z.literal('')]),
  homeScore: z.string().regex(/^[A-Z0-9]{0,4}$/),
  homeTeam: teamLabelSchema,
  homeTeamId: z.union([federationIdSchema, z.literal('')]),
  isReturn: z.enum(['0', '1']),
  phase: z.string().regex(/^\d{0,2}$/)
})
export type FederationEncounterReference = z.infer<
  typeof federationEncounterReferenceSchema
>

const countSchema = z.number().int().min(0).max(999)

export const federationStandingSchema = z.object({
  clubNumber: federationClubNumberSchema.nullable(),
  /** Game points won and lost over the encounters played. */
  gamesLost: countSchema.nullable(),
  gamesWon: countSchema.nullable(),
  played: countSchema,
  /** Standings points. */
  points: countSchema,
  rank: z.number().int().min(1).max(99),
  team: nameSchema,
  teamId: federationIdSchema.nullable()
})
export type FederationStanding = z.infer<typeof federationStandingSchema>

const encounterScoreSchema = z.number().int().min(0).max(999)

export const federationFixtureSchema = z.object({
  awayClubNumber: federationClubNumberSchema.nullable(),
  awayScore: encounterScoreSchema.nullable(),
  awayTeam: teamLabelSchema,
  /** `null` when the federation gives no link to the encounter's sheet. */
  encounter: federationEncounterReferenceSchema.nullable(),
  homeClubNumber: federationClubNumberSchema.nullable(),
  /** Both scores are `null` until the encounter is played. */
  homeScore: encounterScoreSchema.nullable(),
  homeTeam: teamLabelSchema
})
export type FederationFixture = z.infer<typeof federationFixtureSchema>

export const federationRoundSchema = z.object({
  /** The scheduled day, `null` when the federation gives none. */
  date: calendarDateSchema.nullable(),
  fixtures: z.array(federationFixtureSchema),
  number: z.number().int().min(1).max(99)
})
export type FederationRound = z.infer<typeof federationRoundSchema>

export const federationPoolSchema = z.object({
  reference: federationPoolReferenceSchema,
  rounds: z.array(federationRoundSchema),
  standings: z.array(federationStandingSchema)
})
export type FederationPool = z.infer<typeof federationPoolSchema>

export const federationSheetPlayerSchema = z.object({
  /** `NOM Prénom` as printed on the sheet: the federation gives no licence there. */
  name: nameSchema,
  points: rankingPointsSchema.nullable(),
  sex: federationSexSchema.nullable()
})
export type FederationSheetPlayer = z.infer<typeof federationSheetPlayerSchema>

/** A set's points, read from the home side's signed score. */
export const federationSetSchema = z.object({
  away: z.number().int().min(0).max(99),
  home: z.number().int().min(0).max(99)
})
export type FederationSet = z.infer<typeof federationSetSchema>

export const federationGameSchema = z.object({
  /** One name for a single, two for a double. */
  awayPlayers: z.array(nameSchema).max(2),
  /** The points the game brings each team (1/0, 2/1, weighted 6/1…); `null` when not played. */
  awayPoints: z.number().int().min(0).max(99).nullable(),
  homePlayers: z.array(nameSchema).max(2),
  homePoints: z.number().int().min(0).max(99).nullable(),
  sets: z.array(federationSetSchema).max(7)
})
export type FederationGame = z.infer<typeof federationGameSchema>

/** An encounter's sheet once the federation has it: players and games. */
export const federationEncounterSchema = z.object({
  awayPlayers: z.array(federationSheetPlayerSchema),
  awayScore: encounterScoreSchema.nullable(),
  awayTeam: teamLabelSchema,
  games: z.array(federationGameSchema),
  homePlayers: z.array(federationSheetPlayerSchema),
  homeScore: encounterScoreSchema.nullable(),
  homeTeam: teamLabelSchema
})
export type FederationEncounter = z.infer<typeof federationEncounterSchema>

/** One criterion at a time, the way the federation searches clubs. */
export const federationClubSearchSchema = z.union([
  z.object({ name: z.string().trim().min(2).max(60) }),
  z.object({ number: federationClubNumberSchema }),
  z.object({ postcode: z.string().regex(/^\d{5}$/) }),
  /** A département's code, `01` to `95`, `2A`/`2B`, or overseas `971`–`976`. */
  z.object({ department: z.string().regex(/^(\d{2}|2[AB]|97\d)$/) })
])
export type FederationClubSearch = z.infer<typeof federationClubSearchSchema>

export const federationPlayerSearchSchema = z.object({
  firstName: z.string().trim().min(1).max(60).optional(),
  lastName: z.string().trim().min(2).max(60)
})
export type FederationPlayerSearch = z.infer<
  typeof federationPlayerSearchSchema
>
