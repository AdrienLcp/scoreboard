import { z } from 'zod'

/** No `I`, `O`, `0` or `1`: a code is read off a screen and typed on another. */
export const ACCESS_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const UMPIRE_CODE_LENGTH = 6
export const ORGANISER_CODE_LENGTH = 12

export const EVENT_ID_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
export const EVENT_ID_LENGTH = 10

const codeOf = (alphabet: string, length: number): RegExp =>
  new RegExp(`^[${alphabet}]{${length}}$`)

export const eventIdSchema = z
  .string()
  .regex(codeOf(EVENT_ID_ALPHABET, EVENT_ID_LENGTH))
export type EventId = z.infer<typeof eventIdSchema>

export const umpireCodeSchema = z
  .string()
  .regex(codeOf(ACCESS_CODE_ALPHABET, UMPIRE_CODE_LENGTH))
export type UmpireCode = z.infer<typeof umpireCodeSchema>

export const organiserCodeSchema = z
  .string()
  .regex(codeOf(ACCESS_CODE_ALPHABET, ORGANISER_CODE_LENGTH))
export type OrganiserCode = z.infer<typeof organiserCodeSchema>

export const playerIdSchema = z.uuid()
export type PlayerId = z.infer<typeof playerIdSchema>

export const teamIdSchema = z.uuid()
export type TeamId = z.infer<typeof teamIdSchema>

export const matchIdSchema = z.uuid()
export type MatchId = z.infer<typeof matchIdSchema>

export const encounterIdSchema = z.uuid()
export type EncounterId = z.infer<typeof encounterIdSchema>

/** Minted by the device that scored, so a resent event is recognised. */
export const scoringEventIdSchema = z.uuid()
export type ScoringEventId = z.infer<typeof scoringEventIdSchema>

export const MAX_TABLES = 64

export const tableNumberSchema = z.number().int().min(1).max(MAX_TABLES)
export type TableNumber = z.infer<typeof tableNumberSchema>
