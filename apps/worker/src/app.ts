import { Hono } from 'hono'

import { API_PREFIX, SOCKET_PREFIX } from '@scoreboard/protocol/routes'

import { eventRoomsOf } from '@/infrastructure/durable-objects/event-room-namespace'
import {
  answerNotFound,
  answerUnexpected
} from '@/infrastructure/http/error-handling'
import { registerEventRoutes } from '@/infrastructure/http/event-routes'
import { serveWebApp } from '@/infrastructure/http/serve-web-app'
import type { WorkerApp } from '@/infrastructure/http/worker-app'

/** The worker's front door: the API and the event sockets; every other address is the web app. */
export const createApp = (): WorkerApp => {
  const app: WorkerApp = new Hono()

  app.use(async (context, next) => {
    context.set('assets', context.env.ASSETS)
    context.set('eventRooms', eventRoomsOf(context.env.EVENT_ROOMS))
    await next()
  })

  registerEventRoutes(app)

  app.all(`${API_PREFIX}/*`, answerNotFound)
  app.all(`${SOCKET_PREFIX}/*`, answerNotFound)
  app.all('*', (context) => serveWebApp(context.req.raw, context.var.assets))

  app.notFound(answerNotFound)
  app.onError(answerUnexpected)

  return app
}
