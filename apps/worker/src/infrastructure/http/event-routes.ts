import { zValidator } from '@hono/zod-validator'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import { eventIdSchema } from '@scoreboard/protocol/identifiers'
import {
  API_ROUTES,
  type ApiErrorResponse,
  createEventInputSchema,
  EVENT_SOCKET_ROUTE
} from '@scoreboard/protocol/routes'

import { createEvent } from '@/domain/event/event-service'
import { drawSecureCode } from '@/infrastructure/ids'

import { answerNotFound, invalidInput } from './error-handling'
import type { WorkerApp } from './worker-app'

const createEventErrorStatus = {
  no_free_event_id: 503
} as const satisfies Record<'no_free_event_id', ContentfulStatusCode>

export const registerEventRoutes = (app: WorkerApp): void => {
  app.post(
    API_ROUTES.events,
    zValidator('json', createEventInputSchema, invalidInput),
    async (context) => {
      const created = await createEvent({
        drawCode: drawSecureCode,
        input: context.req.valid('json'),
        rooms: context.var.eventRooms
      })

      if (created.status === 'failure') {
        const body: ApiErrorResponse = {
          code: created.error,
          message: 'Could not draw a free event id'
        }

        return context.json(body, createEventErrorStatus[created.error])
      }

      return context.json(created.data, 201)
    }
  )

  app.get(EVENT_SOCKET_ROUTE, async (context) => {
    const eventId = eventIdSchema.safeParse(context.req.param('eventId'))

    if (!eventId.success) {
      return answerNotFound(context)
    }

    return context.var.eventRooms.connect(eventId.data, context.req.raw)
  })
}
