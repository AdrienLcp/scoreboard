import { zValidator } from '@hono/zod-validator'
import type { Context } from 'hono'
import { z } from 'zod'

import {
  FEDERATION_BROWSER_CACHE_SECONDS,
  federationClubNumberSchema,
  federationClubSearchSchema,
  federationEncounterReferenceSchema,
  federationPlayerSearchSchema,
  federationPoolReferenceSchema
} from '@scoreboard/protocol/federation'
import { licenceSchema } from '@scoreboard/protocol/licensee'
import { API_ROUTES, type ApiErrorResponse } from '@scoreboard/protocol/routes'

import type {
  FederationAnswer,
  FederationFailure
} from '@/domain/federation/federation'

import { answerNotFound, invalidInput } from './error-handling'
import type { WorkerApp } from './worker-app'

/** A browser keeps an answer an hour: the worker's own cache already spares the FFTT. */
const FEDERATION_BROWSER_CACHE_CONTROL = `public, max-age=${FEDERATION_BROWSER_CACHE_SECONDS}`

const failureAnswers: Record<
  FederationFailure,
  { body: ApiErrorResponse; status: 502 | 503 }
> = {
  not_configured: {
    body: {
      code: 'federation_not_configured',
      message: 'No FFTT credentials on this server'
    },
    status: 503
  },
  unavailable: {
    body: {
      code: 'federation_unavailable',
      message: 'The FFTT failed or refused the call'
    },
    status: 502
  }
}

/** The federation's answer, its failure as an API error, and `null` as not found. */
const answer = async <TData extends object>(
  context: Context,
  pending: FederationAnswer<TData | null>
) => {
  const result = await pending

  if (result.status === 'failure') {
    const { body, status } = failureAnswers[result.error]
    context.header('Cache-Control', 'no-store')

    return context.json(body, status)
  }

  if (result.data === null) {
    return answerNotFound(context)
  }

  context.header('Cache-Control', FEDERATION_BROWSER_CACHE_CONTROL)

  return context.json(result.data)
}

const clubParamSchema = z.object({ clubNumber: federationClubNumberSchema })

/**
 * The FFTT's data, public as its terms of use require (art. 3): every
 * parameter is checked against its schema before anything reaches the
 * federation.
 */
export const registerFederationRoutes = (app: WorkerApp): void => {
  app.get(
    API_ROUTES.federationClubPlayers,
    zValidator('param', clubParamSchema, invalidInput),
    (context) =>
      answer(
        context,
        context.var.federation.clubPlayers(
          context.req.valid('param').clubNumber
        )
      )
  )

  app.get(
    API_ROUTES.federationClubTeams,
    zValidator('param', clubParamSchema, invalidInput),
    (context) =>
      answer(
        context,
        context.var.federation.clubTeams(context.req.valid('param').clubNumber)
      )
  )

  app.get(
    API_ROUTES.federationClubs,
    zValidator('query', federationClubSearchSchema, invalidInput),
    (context) =>
      answer(
        context,
        context.var.federation.searchClubs(context.req.valid('query'))
      )
  )

  app.get(
    API_ROUTES.federationPlayers,
    zValidator('query', federationPlayerSearchSchema, invalidInput),
    (context) =>
      answer(
        context,
        context.var.federation.searchPlayers(context.req.valid('query'))
      )
  )

  app.get(
    API_ROUTES.federationPlayer,
    zValidator('param', z.object({ licence: licenceSchema }), invalidInput),
    (context) =>
      answer(
        context,
        context.var.federation.player(context.req.valid('param').licence)
      )
  )

  app.get(
    API_ROUTES.federationPool,
    zValidator('query', federationPoolReferenceSchema, invalidInput),
    (context) =>
      answer(context, context.var.federation.pool(context.req.valid('query')))
  )

  app.get(
    API_ROUTES.federationEncounter,
    zValidator('query', federationEncounterReferenceSchema, invalidInput),
    (context) =>
      answer(
        context,
        context.var.federation.encounter(context.req.valid('query'))
      )
  )
}
