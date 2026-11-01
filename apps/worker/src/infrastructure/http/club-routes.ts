import { zValidator } from '@hono/zod-validator'
import type { Context } from 'hono'
import { z } from 'zod'

import {
  clubCodeSchema,
  clubRecordSchema,
  createClubInputSchema
} from '@scoreboard/protocol/club-record'
import { isLogoContentType, MAX_LOGO_BYTES } from '@scoreboard/protocol/logo'
import { API_ROUTES, type ApiErrorResponse } from '@scoreboard/protocol/routes'

import { createClub } from '@/domain/club/club-service'
import type { StoredLogo } from '@/domain/club/clubs'
import { drawSecureCode } from '@/infrastructure/ids'

import {
  answerInvalidInput,
  answerNotFound,
  invalidInput
} from './error-handling'
import type { WorkerApp } from './worker-app'

/** Read case-blind: a code is typed, or scanned from an upper-cased QR. */
const clubCodeOf = (context: Context) => {
  const parsed = clubCodeSchema.safeParse(
    context.req.param('clubCode')?.toUpperCase()
  )

  return parsed.success ? parsed.data : null
}

/** A logo id is never reused: once served, its bytes never change. */
const LOGO_CACHE_CONTROL = 'public, max-age=31536000, immutable'

const logoIdSchema = z.uuid()

/** The media type alone, without the parameters a client may append. */
const logoContentTypeOf = (context: Context) => {
  const mediaType =
    context.req.header('Content-Type')?.split(';')[0]?.trim().toLowerCase() ??
    ''

  return isLogoContentType(mediaType) ? mediaType : null
}

const isLogoSize = (byteCount: number) =>
  byteCount > 0 && byteCount <= MAX_LOGO_BYTES

/** The declared length is checked before the body is read, the read one after. */
const uploadedLogoOf = async (context: Context): Promise<StoredLogo | null> => {
  const contentType = logoContentTypeOf(context)
  const declaredLength = context.req.header('Content-Length')

  if (
    contentType === null ||
    (declaredLength !== undefined && !isLogoSize(Number(declaredLength)))
  ) {
    return null
  }

  const bytes = await context.req.arrayBuffer()

  return isLogoSize(bytes.byteLength) ? { bytes, contentType } : null
}

/**
 * The club's store: whoever holds its code reads and replaces it whole, as
 * the organiser does an event's setup, and uploads its logos; anyone reads a
 * logo by the club's room id, which never gives the code away.
 */
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

  app.post(API_ROUTES.clubLogos, async (context) => {
    const code = clubCodeOf(context)

    if (code === null) {
      return answerNotFound(context)
    }

    const logo = await uploadedLogoOf(context)

    if (logo === null) {
      return answerInvalidInput(context)
    }

    const stored = await context.var.clubs.storeLogo(code, logo)

    if (stored.status === 'failure') {
      return answerNotFound(context)
    }

    return context.json(stored.data, 201)
  })

  app.get(API_ROUTES.logo, async (context) => {
    const logoId = logoIdSchema.safeParse(context.req.param('logoId'))
    const logo = logoId.success
      ? await context.var.clubs.readLogo(
          context.req.param('roomId'),
          logoId.data
        )
      : null

    if (logo === null) {
      return answerNotFound(context)
    }

    context.header('Cache-Control', LOGO_CACHE_CONTROL)
    context.header('Content-Type', logo.contentType)
    context.header('X-Content-Type-Options', 'nosniff')

    return context.body(logo.bytes)
  })
}
