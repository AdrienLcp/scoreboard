import { zValidator } from '@hono/zod-validator'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import { wallPairingCodeSchema } from '@scoreboard/protocol/identifiers'
import {
  API_ROUTES,
  type ApiErrorResponse,
  claimWallPairingInputSchema
} from '@scoreboard/protocol/routes'

import {
  claimWallPairingFor,
  openWallPairingFor
} from '@/domain/wall-pairing/wall-pairing-service'
import { drawSecureCode } from '@/infrastructure/ids'

import { answerNotFound, invalidInput } from './error-handling'
import type { WorkerApp } from './worker-app'

const claimRefusals = {
  event_not_found: {
    body: { code: 'not_found', message: 'No event behind this id' },
    status: 404
  },
  not_found: {
    body: { code: 'not_found', message: 'No screen waits on this code' },
    status: 404
  },
  unknown_display: {
    body: { code: 'unknown_display', message: 'The event has no such display' },
    status: 422
  },
  wrong_code: {
    body: { code: 'wrong_code', message: 'Not the organiser code' },
    status: 403
  }
} as const satisfies Record<
  string,
  { body: ApiErrorResponse; status: ContentfulStatusCode }
>

const pairingCodeOf = (context: Context) => {
  const parsed = wallPairingCodeSchema.safeParse(
    context.req.param('pairingCode')
  )

  return parsed.success ? parsed.data : null
}

export const registerWallPairingRoutes = (app: WorkerApp): void => {
  app.post(API_ROUTES.wallPairings, async (context) => {
    const opened = await openWallPairingFor({
      drawCode: drawSecureCode,
      pairings: context.var.wallPairings
    })

    if (opened.status === 'failure') {
      const body: ApiErrorResponse = {
        code: opened.error,
        message: 'Could not draw a free pairing code'
      }

      return context.json(body, 503)
    }

    return context.json(opened.data, 201)
  })

  app.get(API_ROUTES.wallPairing, async (context) => {
    const code = pairingCodeOf(context)
    const status =
      code === null ? null : await context.var.wallPairings.collect(code)

    if (status === null) {
      return answerNotFound(context)
    }

    context.header('Cache-Control', 'no-store')

    return context.json(status)
  })

  app.post(
    API_ROUTES.wallPairingClaim,
    zValidator('json', claimWallPairingInputSchema, invalidInput),
    async (context) => {
      const code = pairingCodeOf(context)

      if (code === null) {
        return answerNotFound(context)
      }

      const claimed = await claimWallPairingFor({
        code,
        input: context.req.valid('json'),
        pairings: context.var.wallPairings,
        rooms: context.var.eventRooms
      })

      if (claimed.status === 'failure') {
        const refusal = claimRefusals[claimed.error]

        return context.json(refusal.body, refusal.status)
      }

      return context.body(null, 204)
    }
  )
}
