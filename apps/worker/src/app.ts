import { Hono } from 'hono'

import { API_PREFIX, SOCKET_PREFIX } from '@scoreboard/protocol/routes'

import { nowMs } from '@/infrastructure/clock'
import { clubsOf } from '@/infrastructure/durable-objects/club-room-namespace'
import { eventRoomsOf } from '@/infrastructure/durable-objects/event-room-namespace'
import { wallPairingsOf } from '@/infrastructure/durable-objects/wall-pairing-namespace'
import { registerClubRoutes } from '@/infrastructure/http/club-routes'
import {
  answerNotFound,
  answerUnexpected
} from '@/infrastructure/http/error-handling'
import { registerEventRoutes } from '@/infrastructure/http/event-routes'
import { registerFederationRoutes } from '@/infrastructure/http/federation-routes'
import { serveWebApp } from '@/infrastructure/http/serve-web-app'
import { registerWallPairingRoutes } from '@/infrastructure/http/wall-pairing-routes'
import type { WorkerApp } from '@/infrastructure/http/worker-app'
import { federationOf } from '@/infrastructure/smartping/federation-of-settings'
import { workersResponseCache } from '@/infrastructure/smartping/workers-response-cache'

/** The worker's front door: the API and the event sockets; every other address is the web app. */
export const createApp = (): WorkerApp => {
  const app: WorkerApp = new Hono()

  app.use(async (context, next) => {
    context.set('assets', context.env.ASSETS)
    context.set('clubs', clubsOf(context.env.CLUB_ROOMS))
    context.set('eventRooms', eventRoomsOf(context.env.EVENT_ROOMS))
    context.set(
      'federation',
      federationOf({
        cache: () => workersResponseCache(caches.default),
        fetch: (input, init) => fetch(input, init),
        now: nowMs,
        settings: context.env
      })
    )
    context.set('wallPairings', wallPairingsOf(context.env.WALL_PAIRINGS))
    await next()
  })

  registerClubRoutes(app)
  registerEventRoutes(app)
  registerFederationRoutes(app)
  registerWallPairingRoutes(app)

  app.all(`${API_PREFIX}/*`, answerNotFound)
  app.all(`${SOCKET_PREFIX}/*`, answerNotFound)
  app.all('*', (context) => serveWebApp(context.req.raw, context.var.assets))

  app.notFound(answerNotFound)
  app.onError(answerUnexpected)

  return app
}
