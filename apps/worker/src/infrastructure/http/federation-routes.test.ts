import { Result } from '@adrienlcp/result'
import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import {
  federationEncounterSchema,
  federationPlayerSchema,
  federationPoolSchema
} from '@scoreboard/protocol/federation'
import {
  API_ROUTES,
  apiErrorResponseSchema,
  fillRoute
} from '@scoreboard/protocol/routes'

import type { Federation } from '@/domain/federation/federation'
import { fakeFederation } from '@/infrastructure/smartping/fake-federation'
import {
  FAKE_HOME_CLUB,
  FAKE_POOL,
  FAKE_POOL_REFERENCE
} from '@/infrastructure/smartping/fake-federation-data'
import { unconfiguredFederation } from '@/infrastructure/smartping/federation-of-settings'

import { registerFederationRoutes } from './federation-routes'
import type { WorkerApp } from './worker-app'

const appWith = (federation: Federation) => {
  const app: WorkerApp = new Hono()
  app.use(async (context, next) => {
    context.set('federation', federation)
    await next()
  })
  registerFederationRoutes(app)

  return app
}

const errorCodeOf = async (response: Response) =>
  apiErrorResponseSchema.parse(await response.json()).code

const clubPlayersPath = (clubNumber: string) =>
  fillRoute(API_ROUTES.federationClubPlayers, { clubNumber })

const unavailableFederation: Federation = {
  ...fakeFederation,
  clubPlayers: async () => Result.failure('unavailable')
}

describe('the federation routes', () => {
  it('[federation] answer 503 federation_not_configured without credentials', async () => {
    const response = await appWith(unconfiguredFederation).request(
      clubPlayersPath(FAKE_HOME_CLUB.number)
    )

    expect(response.status).toBe(503)
    expect(await errorCodeOf(response)).toBe('federation_not_configured')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('[federation] answer 502 federation_unavailable when the FFTT fails', async () => {
    const response = await appWith(unavailableFederation).request(
      clubPlayersPath(FAKE_HOME_CLUB.number)
    )

    expect(response.status).toBe(502)
    expect(await errorCodeOf(response)).toBe('federation_unavailable')
  })

  it('[federation] turn down a parameter that is not what the FFTT takes, before reaching it', async () => {
    const app = appWith(unconfiguredFederation)
    const paths = [
      clubPlayersPath('1285007'),
      fillRoute(API_ROUTES.federationPlayer, { licence: '12ab' }),
      `${API_ROUTES.federationClubs}?postcode=8575`,
      `${API_ROUTES.federationPlayers}?lastName=B`,
      `${API_ROUTES.federationPool}?division=200001&pool=x`,
      `${API_ROUTES.federationEncounter}?encounterId=1&isReturn=2`
    ]

    for (const path of paths) {
      const response = await app.request(path)

      expect(response.status, path).toBe(400)
      expect(await errorCodeOf(response)).toBe('invalid_input')
    }
  })

  it('[federation] serve a club’s players, cached an hour in the browser', async () => {
    const response = await appWith(fakeFederation).request(
      clubPlayersPath(FAKE_HOME_CLUB.number)
    )
    const players = federationPlayerSchema.array().parse(await response.json())

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600')
    expect(players).toHaveLength(12)
  })

  it('[federation] serve a pool by its reference, and a played encounter’s sheet by its link', async () => {
    const app = appWith(fakeFederation)
    const poolResponse = await app.request(
      `${API_ROUTES.federationPool}?${new URLSearchParams(FAKE_POOL_REFERENCE)}`
    )
    const pool = federationPoolSchema.parse(await poolResponse.json())
    const reference = pool.rounds[0]?.fixtures[0]?.encounter

    expect(pool.rounds).toHaveLength(7)
    expect(pool.standings).toHaveLength(8)
    expect(reference).toEqual(FAKE_POOL.rounds[0]?.fixtures[0]?.encounter)

    const encounterResponse = await app.request(
      `${API_ROUTES.federationEncounter}?${new URLSearchParams(reference ?? {})}`
    )
    const encounter = federationEncounterSchema.parse(
      await encounterResponse.json()
    )

    expect(encounter.games).toHaveLength(14)
  })

  it('[federation] answer 404 for an unknown licence and an encounter not yet played', async () => {
    const app = appWith(fakeFederation)
    const unplayed = FAKE_POOL.rounds.at(-1)?.fixtures[0]?.encounter ?? {}

    expect(
      (
        await app.request(
          fillRoute(API_ROUTES.federationPlayer, { licence: '1234567' })
        )
      ).status
    ).toBe(404)
    expect(
      (
        await app.request(
          `${API_ROUTES.federationEncounter}?${new URLSearchParams(unplayed)}`
        )
      ).status
    ).toBe(404)
  })

  it('[federation] search clubs by name, without accents', async () => {
    const response = await appWith(fakeFederation).request(
      `${API_ROUTES.federationClubs}?name=lucon`
    )

    expect(await response.json()).toEqual([
      { name: 'LUCON TENNIS DE TABLE', number: '12850097' }
    ])
  })
})
