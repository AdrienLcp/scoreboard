import { z } from 'zod'

import { clubIdentitySchema } from './club'
import { encounterFormatIdSchema } from './encounter-format-id'
import {
  encounterIdSchema,
  MAX_TABLES,
  matchIdSchema,
  playerIdSchema,
  tableNumberSchema,
  teamIdSchema
} from './identifiers'
import { matchFormatSchema } from './match-format'

export const MAX_PLAYERS = 500
export const MAX_MATCHES = 1000

const nameSchema = z.string().trim().min(1).max(80)

export const playerSchema = z.object({
  id: playerIdSchema,
  name: nameSchema,
  teamId: teamIdSchema.nullable()
})
export type Player = z.infer<typeof playerSchema>

export const teamSchema = z.object({
  id: teamIdSchema,
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
  table: tableNumberSchema.nullable()
})
export type MatchSetup = z.infer<typeof matchSetupSchema>

export const encounterSchema = z.object({
  away: teamIdSchema,
  formatId: encounterFormatIdSchema,
  home: teamIdSchema,
  id: encounterIdSchema
})
export type Encounter = z.infer<typeof encounterSchema>

/**
 * Everything the organiser prepares. `matches` is in playing order: a table
 * plays its matches in the order they appear here.
 */
export const eventSetupSchema = z.object({
  club: clubIdentitySchema.nullable(),
  defaultFormat: matchFormatSchema,
  encounters: z.array(encounterSchema).max(100),
  matches: z.array(matchSetupSchema).max(MAX_MATCHES),
  name: nameSchema,
  players: z.array(playerSchema).max(MAX_PLAYERS),
  tableCount: z.number().int().min(1).max(MAX_TABLES),
  teams: z.array(teamSchema).max(100)
})
export type EventSetup = z.infer<typeof eventSetupSchema>
