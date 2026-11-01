import { z } from 'zod'

import {
  displayIdSchema,
  eventIdSchema,
  MAX_TABLES,
  organiserCodeSchema,
  wallPairingCodeSchema
} from './identifiers.ts'
import { matchFormatSchema } from './match-format.ts'

export const API_PREFIX = '/api'
export const SOCKET_PREFIX = '/ws'

/** Every path either end names: the worker matches the pattern, the client fills it. */
export const API_ROUTES = {
  club: `${API_PREFIX}/clubs/:clubCode`,
  clubs: `${API_PREFIX}/clubs`,
  events: `${API_PREFIX}/events`,
  wallPairing: `${API_PREFIX}/wall-pairings/:pairingCode`,
  wallPairingClaim: `${API_PREFIX}/wall-pairings/:pairingCode/claim`,
  wallPairings: `${API_PREFIX}/wall-pairings`
} as const

export const EVENT_SOCKET_ROUTE = `${SOCKET_PREFIX}/events/:eventId` as const

type RouteParam<TRoute extends string> =
  TRoute extends `${string}:${infer Param}/${infer Rest}`
    ? Param | RouteParam<Rest>
    : TRoute extends `${string}:${infer Param}`
      ? Param
      : never

export const fillRoute = <TRoute extends string>(
  route: TRoute,
  params: Readonly<Record<RouteParam<TRoute>, string>>
): string => {
  const values: Readonly<Record<string, string>> = params

  return route.replace(/:(\w+)/g, (_, name: string) =>
    encodeURIComponent(values[name] ?? '')
  )
}

export const createEventInputSchema = z.object({
  format: matchFormatSchema,
  name: z.string().trim().min(1).max(80),
  tableCount: z.number().int().min(1).max(MAX_TABLES)
})
export type CreateEventInput = z.infer<typeof createEventInputSchema>

export const createdEventSchema = z.object({
  eventId: eventIdSchema,
  organiserCode: organiserCodeSchema
})
export type CreatedEvent = z.infer<typeof createdEventSchema>

/** A screen just put on the wall, waiting for the organiser to tell it which event to show. */
export const openedWallPairingSchema = z.object({
  code: wallPairingCodeSchema,
  expiresAtMs: z.number().int()
})
export type OpenedWallPairing = z.infer<typeof openedWallPairingSchema>

/** The screen and its event; `null` shows every table. */
export const pairedWallSchema = z.object({
  displayId: displayIdSchema.nullable(),
  eventId: eventIdSchema
})
export type PairedWall = z.infer<typeof pairedWallSchema>

export const wallPairingStatusSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('waiting') }),
  pairedWallSchema.extend({ status: z.literal('paired') })
])
export type WallPairingStatus = z.infer<typeof wallPairingStatusSchema>

/** The organiser vouches for the screen with the event's own code. */
export const claimWallPairingInputSchema = pairedWallSchema.extend({
  organiserCode: organiserCodeSchema
})
export type ClaimWallPairingInput = z.infer<typeof claimWallPairingInputSchema>

export const apiErrorCodes = [
  'invalid_input',
  'not_found',
  'internal_error',
  'no_free_event_id',
  'no_free_pairing_code',
  'no_free_club_code',
  'wrong_code',
  'unknown_display'
] as const
export const apiErrorResponseSchema = z.object({
  code: z.enum(apiErrorCodes),
  message: z.string()
})
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>
