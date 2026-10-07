import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestHarness } from 'wrangler'

import {
  API_ROUTES,
  apiErrorResponseSchema,
  createdEventSchema,
  EVENT_SOCKET_ROUTE,
  fillRoute
} from '@scoreboard/protocol/routes'
import { serverMessageSchema } from '@scoreboard/protocol/server-message'
import { BEST_OF_3 } from '@scoreboard/protocol/testing/match-formats'
import { PROTOCOL_VERSION } from '@scoreboard/protocol/version'

const WORKERD_START_TIMEOUT_MS = 120_000

mkdirSync(resolve(import.meta.dirname, '../../../../web/dist'), {
  recursive: true
})

const server = createTestHarness({
  workers: [
    { configPath: resolve(import.meta.dirname, '../../../wrangler.jsonc') }
  ]
})

const postEvent = (body: string) =>
  server.fetch(API_ROUTES.events, {
    body,
    headers: { 'Content-Type': 'application/json' },
    method: 'POST'
  })

const errorCodeOf = async (response: { json: () => Promise<unknown> }) =>
  apiErrorResponseSchema.parse(await response.json()).code

beforeAll(() => server.listen(), WORKERD_START_TIMEOUT_MS)
beforeEach(() => server.reset(), WORKERD_START_TIMEOUT_MS)
afterAll(() => server.close(), WORKERD_START_TIMEOUT_MS)

describe('the worker', () => {
  it('opens an event and hands back its id and organiser code', async () => {
    const response = await postEvent(
      JSON.stringify({ format: BEST_OF_3, name: 'Club day', tableCount: 2 })
    )

    expect(response.status).toBe(201)
    expect(createdEventSchema.safeParse(await response.json()).success).toBe(
      true
    )
  })

  it('refuses an event that does not match the contract', async () => {
    const response = await postEvent(
      JSON.stringify({ format: BEST_OF_3, name: '', tableCount: 2 })
    )

    expect(response.status).toBe(400)
    expect(await errorCodeOf(response)).toBe('invalid_input')
  })

  it('refuses a body that is not JSON', async () => {
    const response = await postEvent('{ not json')

    expect(response.status).toBe(400)
    expect(await errorCodeOf(response)).toBe('invalid_input')
  })

  it.each([
    `${API_ROUTES.events}/club-day`,
    '/api/nope',
    fillRoute(EVENT_SOCKET_ROUTE, { eventId: 'not-an-id' })
  ])('answers 404 not_found on %s', async (path) => {
    const response = await server.fetch(path)

    expect(response.status).toBe(404)
    expect(await errorCodeOf(response)).toBe('not_found')
  })

  it('answers 404 on an address that names no page', async () => {
    const response = await server.fetch('/nope')

    expect(response.status).toBe(404)
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex')
  })

  it("admits the organiser on the event's socket and sends its snapshot", async () => {
    const created = createdEventSchema.parse(
      await (
        await postEvent(
          JSON.stringify({ format: BEST_OF_3, name: 'Club day', tableCount: 2 })
        )
      ).json()
    )

    const upgraded = await server.fetch(
      fillRoute(EVENT_SOCKET_ROUTE, { eventId: created.eventId }),
      { headers: { Upgrade: 'websocket' } }
    )
    const socket = upgraded.webSocket

    expect(upgraded.status).toBe(101)

    if (socket === null) {
      throw new Error('The upgrade carried no socket')
    }

    socket.accept()
    const firstMessage = new Promise<unknown>((resolve) => {
      socket.addEventListener('message', (message) => {
        resolve(JSON.parse(String(message.data)))
      })
    })
    socket.send(
      JSON.stringify({
        credentials: { code: created.organiserCode, role: 'organiser' },
        protocolVersion: PROTOCOL_VERSION,
        type: 'hello'
      })
    )

    expect(serverMessageSchema.parse(await firstMessage).type).toBe(
      'snapshot.organiser'
    )
    socket.close()
  })
})
