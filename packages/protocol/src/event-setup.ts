import { z } from 'zod'

import { clubIdentitySchema, hexColourSchema } from './club'
import { encounterFormatIdSchema } from './encounter-format-id'
import { hallPlanSchema } from './hall-plan'
import {
  displayIdSchema,
  encounterIdSchema,
  MAX_TABLES,
  matchIdSchema,
  playerIdSchema,
  tableNumberSchema,
  teamIdSchema
} from './identifiers'
import { licenceSchema, rankingPointsSchema } from './licensee'
import { logoUrlSchema } from './logo'
import { matchFormatSchema } from './match-format'
import {
  DEFAULT_MATCH_POINTS_RULE,
  matchPointsRuleIdSchema
} from './match-points-rule'
import { instantMsSchema } from './scoring-event'
import { matchStageSchema, tournamentSchema } from './tournament'

export const MAX_PLAYERS = 500
export const MAX_MATCHES = 1000

const nameSchema = z.string().trim().min(1).max(80)

export const playerSchema = z.object({
  id: playerIdSchema,
  /** Known when the player came from the club's directory. */
  licence: licenceSchema.nullable().default(null),
  name: nameSchema,
  points: rankingPointsSchema.nullable().default(null),
  teamId: teamIdSchema.nullable()
})
export type Player = z.infer<typeof playerSchema>

export const teamSchema = z.object({
  /** The team's own colour on the wall; `null` wears the default. */
  colour: hexColourSchema.nullable().default(null),
  id: teamIdSchema,
  /** The club's logo, for a tournament where each team stands for a club. */
  logoUrl: logoUrlSchema.nullable().optional(),
  name: nameSchema
})
export type Team = z.infer<typeof teamSchema>

/**
 * One side of a match: one player for a singles, two for a doubles, none yet
 * while a team has not named who plays.
 */
export const participantSchema = z.object({
  playerIds: z.array(playerIdSchema).max(2)
})
export type Participant = z.infer<typeof participantSchema>

export const matchSetupSchema = z.object({
  away: participantSchema,
  encounterId: encounterIdSchema.nullable(),
  format: matchFormatSchema,
  home: participantSchema,
  id: matchIdSchema,
  /** The line on a team sheet, like `AW` or `Double 1`. */
  label: z.string().trim().max(40).nullable(),
  /** When the organiser wants it played: it never starts earlier in the estimates. */
  plannedAtMs: instantMsSchema.nullable().default(null),
  /** Its place in an individual tournament's pools or bracket; absent outside one. */
  stage: matchStageSchema.nullable().optional(),
  table: tableNumberSchema.nullable()
})
export type MatchSetup = z.infer<typeof matchSetupSchema>

export const encounterSchema = z.object({
  away: teamIdSchema,
  formatId: encounterFormatIdSchema,
  home: teamIdSchema,
  id: encounterIdSchema,
  matchPoints: matchPointsRuleIdSchema.default(DEFAULT_MATCH_POINTS_RULE)
})
export type Encounter = z.infer<typeof encounterSchema>

/**
 * One of the event's screens and the tables it shows, when the hall has more
 * tables than one screen can hold. An event without any shows every table on
 * every screen.
 */
export const displaySchema = z.object({
  id: displayIdSchema,
  name: nameSchema,
  tables: z.array(tableNumberSchema).min(1).max(MAX_TABLES)
})
export type Display = z.infer<typeof displaySchema>

/**
 * Everything the organiser prepares. `matches` is in playing order: a table
 * plays its matches in the order they appear here.
 */
export const eventSetupSchema = z.object({
  club: clubIdentitySchema.nullable(),
  defaultFormat: matchFormatSchema,
  displays: z.array(displaySchema).max(16).default([]),
  encounters: z.array(encounterSchema).max(100),
  /** Where the tables stand; `null` keeps the default plan for the table count. */
  hall: hallPlanSchema.nullable().default(null),
  matches: z.array(matchSetupSchema).max(MAX_MATCHES),
  name: nameSchema,
  players: z.array(playerSchema).max(MAX_PLAYERS),
  /** When play begins: no table is estimated to start before it. */
  startsAtMs: instantMsSchema.nullable().default(null),
  tableCount: z.number().int().min(1).max(MAX_TABLES),
  teams: z.array(teamSchema).max(100),
  /** Pools then a bracket, where each player's team is the club he stands for. */
  tournament: tournamentSchema.nullable().optional()
})
export type EventSetup = z.infer<typeof eventSetupSchema>
