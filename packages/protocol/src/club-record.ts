import { z } from 'zod'

import { hexColourSchema } from './club'
import { encounterFormatIdSchema } from './encounter-format-id'
import { hallPlanSchema } from './hall-plan'
import {
  ACCESS_CODE_ALPHABET,
  playerIdSchema,
  tableNumberSchema,
  teamIdSchema
} from './identifiers'
import { licenceSchema, rankingPointsSchema } from './licensee'
import { logoUrlSchema } from './logo'
import {
  DEFAULT_MATCH_POINTS_RULE,
  matchPointsRuleIdSchema
} from './match-points-rule'

export const CLUB_CODE_LENGTH = 12

/** The club's one key: it finds the club's store and opens it, on any device. */
export const clubCodeSchema = z
  .string()
  .regex(new RegExp(`^[${ACCESS_CODE_ALPHABET}]{${CLUB_CODE_LENGTH}}$`))
export type ClubCode = z.infer<typeof clubCodeSchema>

export const directoryClubIdSchema = z.uuid()
export type DirectoryClubId = z.infer<typeof directoryClubIdSchema>

const nameSchema = z.string().trim().min(1).max(80)

/** Where a directory entry comes from: the FFTT's data lives under its own cache rule, apart from what the club entered. */
export const directorySourceSchema = z.enum(['typed', 'fftt'])
export type DirectorySource = z.infer<typeof directorySourceSchema>

/** A licensee the club met once: picked again, never typed twice. */
export const directoryPlayerSchema = z.object({
  firstName: nameSchema,
  id: playerIdSchema,
  lastName: nameSchema,
  licence: licenceSchema.nullable(),
  points: rankingPointsSchema.nullable(),
  source: directorySourceSchema
})
export type DirectoryPlayer = z.infer<typeof directoryPlayerSchema>

/** At most a 6-player sheet: letters in order, A to F or X to T. */
export const MAX_LINEUP = 6

export const directoryTeamSchema = z.object({
  colour: hexColourSchema,
  /** "D2", "R3": as the federation's calendar names it. */
  division: z.string().trim().max(40).nullable(),
  formatId: encounterFormatIdSchema,
  id: teamIdSchema,
  /** The last composition, letter by letter (`null` for a letter nobody holds): the next encounter starts from it. */
  lineup: z.array(playerIdSchema.nullable()).max(MAX_LINEUP),
  matchPoints: matchPointsRuleIdSchema.default(DEFAULT_MATCH_POINTS_RULE),
  name: nameSchema,
  /** The tables a home encounter is set on, one per group of its sheet. */
  tables: z.array(tableNumberSchema).max(2)
})
export type DirectoryTeam = z.infer<typeof directoryTeamSchema>

export const directoryClubSchema = z.object({
  id: directoryClubIdSchema,
  /** Uploaded once on the club page: the wall's header, the spectators' tags, the Top 12. */
  logoUrl: logoUrlSchema.nullable().default(null),
  name: nameSchema,
  /** FFTT club number, 8 digits: the key the federation's data is fetched by. */
  number: z
    .string()
    .regex(/^\d{8}$/)
    .nullable(),
  players: z.array(directoryPlayerSchema).max(300),
  teams: z.array(directoryTeamSchema).max(20)
})
export type DirectoryClub = z.infer<typeof directoryClubSchema>

/**
 * Everything a club keeps between its Sundays: its own teams and licensees,
 * and the clubs it meets with theirs, so a day is prepared by picking.
 */
export const clubRecordSchema = z.object({
  /** The club's own hall, kept from an event's plan: every new event starts from it. */
  hall: hallPlanSchema.nullable().default(null),
  /** What an opposing team wears on the wall until the club picks otherwise. */
  opponentColour: hexColourSchema,
  opponents: z.array(directoryClubSchema).max(200),
  own: directoryClubSchema
})
export type ClubRecord = z.infer<typeof clubRecordSchema>

export const createClubInputSchema = z.object({ name: nameSchema })
export type CreateClubInput = z.infer<typeof createClubInputSchema>

export const createdClubSchema = z.object({ clubCode: clubCodeSchema })
export type CreatedClub = z.infer<typeof createdClubSchema>
