import { eventIdSchema } from '@scoreboard/protocol/identifiers'
import {
  API_PREFIX,
  API_ROUTES,
  type ApiErrorResponse,
  type CreatedEvent,
  createEventInputSchema,
  EVENT_SOCKET_ROUTE,
  SOCKET_PREFIX
} from '@scoreboard/protocol/routes'

import {
  newEventId,
  newOrganiserCode
} from '@scoreboard/core/access/access-codes'

import type { Env } from '@/env'
import { cryptoRandomIndex } from '@/infrastructure/random'

const EVENT_SOCKET_PATTERN = new URLPattern({ pathname: EVENT_SOCKET_ROUTE })

/** An event id is drawn at random; a clash is retried rather than overwritten. */
const OPEN_ATTEMPTS = 3

const apiError = (
  status: number,
  code: ApiErrorResponse['code'],
  message: string
): Response =>
  Response.json({ code, message } satisfies ApiErrorResponse, { status })

const readJson = async (request: Request): Promise<unknown> => {
  try {
    return await request.json()
  } catch {
    return null
  }
}

const createEvent = async (request: Request, env: Env): Promise<Response> => {
  const input = createEventInputSchema.safeParse(await readJson(request))

  if (!input.success) {
    return apiError(400, 'invalid_input', input.error.message)
  }

  for (let attempt = 0; attempt < OPEN_ATTEMPTS; attempt++) {
    const eventId = newEventId(cryptoRandomIndex)
    const organiserCode = newOrganiserCode(cryptoRandomIndex)
    const room = env.EVENT_ROOMS.get(env.EVENT_ROOMS.idFromName(eventId))
    const opened = await room.open(input.data, organiserCode)

    if (opened.status === 'success') {
      return Response.json({ eventId, organiserCode } satisfies CreatedEvent, {
        status: 201
      })
    }
  }

  return apiError(500, 'internal_error', 'Could not draw a free event id')
}

const connectToEvent = (
  request: Request,
  env: Env
): Response | Promise<Response> => {
  const eventId = eventIdSchema.safeParse(
    EVENT_SOCKET_PATTERN.exec(request.url)?.pathname.groups.eventId
  )

  if (!eventId.success) {
    return apiError(404, 'not_found', 'No event behind this address')
  }

  return env.EVENT_ROOMS.get(env.EVENT_ROOMS.idFromName(eventId.data)).fetch(
    request
  )
}

/** The worker's front door: the API and the event sockets; the rest is the web app's assets. */
export const handleRequest = (
  request: Request,
  env: Env
): Response | Promise<Response> => {
  const { pathname } = new URL(request.url)

  if (pathname === API_ROUTES.events && request.method === 'POST') {
    return createEvent(request, env)
  }

  if (pathname.startsWith(`${SOCKET_PREFIX}/`)) {
    return connectToEvent(request, env)
  }

  if (pathname.startsWith(`${API_PREFIX}/`)) {
    return apiError(404, 'not_found', 'No route behind this address')
  }

  return env.ASSETS.fetch(request)
}
