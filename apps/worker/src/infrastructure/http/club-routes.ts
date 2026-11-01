import { zValidator } from '@hono/zod-validator'
import type { Context } from 'hono'

import {
  clubCodeSchema,
  clubRecordSchema,
  createClubInputSchema
} from '@scoreboard/protocol/club-record'
import { API_ROUTES, type ApiErrorResponse } from '@scoreboard/protocol/routes'

import { createClub } from '@/domain/club/club-service'
import { drawSecureCode } from '@/infrastructure/ids'

import { answerNotFound, invalidInput } from './error-handling'
import type { WorkerApp } from './worker-app'

/** Read case-blind: a code is typed, or scanned from an upper-cased QR. */
const clubCodeOf = (context: Context) => {
  const parsed = clubCodeSchema.safeParse(
    context.req.param('clubCode')?.toUpperCase()
  )

  return parsed.success ? parsed.data : null
}

/** The club's store: whoever holds its code reads and replaces it whole, as the organiser does an event's setup. */
export const registerClubRoutes = (app: WorkerApp): void => {
  app.post(
    API_ROUTES.clubs,
    zValidator('json', createClubInputSchema, invalidInput),
    async (context) => {
      const created = await createClub({
        clubs: context.var.clubs,
        drawCode: drawSecureCode,
        input: context.req.valid('json'),
        newClubId: () => crypto.randomUUID()
      })

      if (created.status === 'failure') {
        const body: ApiErrorResponse = {
          code: created.error,
          message: 'Could not draw a free club code'
        }

        return context.json(body, 503)
      }

      return context.json(created.data, 201)
    }
  )

  app.get(API_ROUTES.club, async (context) => {
    const code = clubCodeOf(context)
    const record = code === null ? null : await context.var.clubs.read(code)

    if (record === null) {
      return answerNotFound(context)
    }

    context.header('Cache-Control', 'no-store')

    return context.json(record)
  })

  app.put(
    API_ROUTES.club,
    zValidator('json', clubRecordSchema, invalidInput),
    async (context) => {
      const code = clubCodeOf(context)
      const written =
        code === null
          ? null
          : await context.var.clubs.write(code, context.req.valid('json'))

      if (written === null || written.status === 'failure') {
        return answerNotFound(context)
      }

      return context.body(null, 204)
    }
  )
}
