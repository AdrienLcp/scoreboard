import { z } from 'zod'

import { eventSetupSchema } from './event-setup'
import {
  matchIdSchema,
  organiserCodeSchema,
  umpireCodeSchema
} from './identifiers'
import { scoringEventSchema } from './scoring-event'

export const connectionRoles = [
  'display',
  'spectator',
  'umpire',
  'organiser'
] as const
export const connectionRoleSchema = z.enum(connectionRoles)
export type ConnectionRole = z.infer<typeof connectionRoleSchema>

export const credentialsSchema = z.discriminatedUnion('role', [
  z.object({ role: z.literal('display') }),
  /** A visitor's phone: read-only, like the display. */
  z.object({ role: z.literal('spectator') }),
  z.object({ code: umpireCodeSchema, role: z.literal('umpire') }),
  z.object({ code: organiserCodeSchema, role: z.literal('organiser') })
])
export type Credentials = z.infer<typeof credentialsSchema>

/** The first frame on every socket. */
export const helloMessageSchema = z.object({
  credentials: credentialsSchema,
  protocolVersion: z.number().int().positive(),
  type: z.literal('hello')
})
export type HelloMessage = z.infer<typeof helloMessageSchema>

/** An umpire scoring their table's match, or the organiser correcting any match. */
export const recordMessageSchema = z.object({
  event: scoringEventSchema,
  matchId: matchIdSchema,
  type: z.literal('match.record')
})
export type RecordMessage = z.infer<typeof recordMessageSchema>

/** The organiser's whole setup, replacing the previous one. */
export const setupSaveMessageSchema = z.object({
  setup: eventSetupSchema,
  type: z.literal('setup.save')
})
export type SetupSaveMessage = z.infer<typeof setupSaveMessageSchema>

/** The organiser erasing the event and everything it holds, before its retention runs out. */
export const eventDeleteMessageSchema = z.object({
  type: z.literal('event.delete')
})
export type EventDeleteMessage = z.infer<typeof eventDeleteMessageSchema>

export const clientMessageSchema = z.discriminatedUnion('type', [
  helloMessageSchema,
  recordMessageSchema,
  setupSaveMessageSchema,
  eventDeleteMessageSchema
])
export type ClientMessage = z.infer<typeof clientMessageSchema>
