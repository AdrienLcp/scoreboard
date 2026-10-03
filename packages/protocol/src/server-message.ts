import { z } from 'zod'

import {
  protocolErrorCodeSchema,
  recordRefusalSchema,
  setupRefusalSchema
} from './error-code'
import {
  organiserSnapshotSchema,
  publicSnapshotSchema,
  umpireSnapshotSchema
} from './event-snapshot'
import { scoringEventIdSchema } from './identifiers'

export const displaySnapshotMessageSchema = z.object({
  snapshot: publicSnapshotSchema,
  type: z.literal('snapshot.display')
})

export const spectatorSnapshotMessageSchema = z.object({
  snapshot: publicSnapshotSchema,
  type: z.literal('snapshot.spectator')
})

export const umpireSnapshotMessageSchema = z.object({
  snapshot: umpireSnapshotSchema,
  type: z.literal('snapshot.umpire')
})

export const organiserSnapshotMessageSchema = z.object({
  snapshot: organiserSnapshotSchema,
  type: z.literal('snapshot.organiser')
})

/** Also sent for an event the server already held: the device may forget it. */
export const recordAcceptedMessageSchema = z.object({
  eventId: scoringEventIdSchema,
  type: z.literal('record.accepted')
})

export const recordRefusedMessageSchema = z.object({
  eventId: scoringEventIdSchema,
  reason: recordRefusalSchema,
  type: z.literal('record.refused')
})

export const setupRefusedMessageSchema = z.object({
  reason: setupRefusalSchema,
  type: z.literal('setup.refused')
})

/** `message` is English for a log and never shown; the client translates `code`. */
export const protocolErrorMessageSchema = z.object({
  code: protocolErrorCodeSchema,
  /** The socket is closed after a fatal error and the client stops reconnecting. */
  fatal: z.boolean(),
  message: z.string(),
  type: z.literal('error')
})
export type ProtocolErrorMessage = z.infer<typeof protocolErrorMessageSchema>

export const serverMessageSchema = z.discriminatedUnion('type', [
  displaySnapshotMessageSchema,
  spectatorSnapshotMessageSchema,
  umpireSnapshotMessageSchema,
  organiserSnapshotMessageSchema,
  recordAcceptedMessageSchema,
  recordRefusedMessageSchema,
  setupRefusedMessageSchema,
  protocolErrorMessageSchema
])
export type ServerMessage = z.infer<typeof serverMessageSchema>
