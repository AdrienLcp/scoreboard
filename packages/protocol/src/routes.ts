import { z } from 'zod'

import {
  eventIdSchema,
  MAX_TABLES,
  organiserCodeSchema
} from './identifiers.ts'
import { matchFormatSchema } from './match-format.ts'

export const API_PREFIX = '/api'
export const SOCKET_PREFIX = '/ws'

/** Every path either end names: the worker matches the pattern, the client fills it. */
export const API_ROUTES = {
  events: `${API_PREFIX}/events`
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

export const apiErrorCodes = [
  'invalid_input',
  'not_found',
  'internal_error',
  'no_free_event_id'
] as const
export const apiErrorResponseSchema = z.object({
  code: z.enum(apiErrorCodes),
  message: z.string()
})
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>
