import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestHarness } from 'wrangler'

import {
  API_ROUTES,
  apiErrorResponseSchema,
  createdEventSchema,
  EVENT_SOCKET_ROUTE,
  fillRoute,
  openedWallPairingSchema,
  wallPairingStatusSchema
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

describe('the wall pairing', () => {
  const openEvent = async () =>
    createdEventSchema.parse(
      await (
        await postEvent(
          JSON.stringify({ format: BEST_OF_3, name: 'Club day', tableCount: 2 })
        )
      ).json()
    )

  const openPairing = async () =>
    openedWallPairingSchema.parse(
      await (
        await server.fetch(API_ROUTES.wallPairings, { method: 'POST' })
      ).json()
    ).code

  const statusOf = (pairingCode: string) =>
    server.fetch(fillRoute(API_ROUTES.wallPairing, { pairingCode }))

  const claim = (pairingCode: string, body: object) =>
    server.fetch(fillRoute(API_ROUTES.wallPairingClaim, { pairingCode }), {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST'
    })

  it('hands the screen its event once the organiser claims it, then forgets the code', async () => {
    const { eventId, organiserCode } = await openEvent()
    const pairingCode = await openPairing()

    expect(
      wallPairingStatusSchema.parse(await (await statusOf(pairingCode)).json())
    ).toEqual({ status: 'waiting' })

    const claimed = await claim(pairingCode, {
      displayId: null,
      eventId,
      organiserCode
    })

    expect(claimed.status).toBe(204)
    expect(
      wallPairingStatusSchema.parse(await (await statusOf(pairingCode)).json())
    ).toEqual({ displayId: null, eventId, status: 'paired' })
    expect((await statusOf(pairingCode)).status).toBe(404)
  })

  it('refuses a claim without the organiser code', async () => {
    const { eventId } = await openEvent()
    const pairingCode = await openPairing()
    const claimed = await claim(pairingCode, {
      displayId: null,
      eventId,
      organiserCode: 'ABCDEFGHJKLM'
    })

    expect(claimed.status).toBe(403)
    expect(await errorCodeOf(claimed)).toBe('wrong_code')
  })

  it('refuses a display the event does not have', async () => {
    const { eventId, organiserCode } = await openEvent()
    const pairingCode = await openPairing()
    const claimed = await claim(pairingCode, {
      displayId: crypto.randomUUID(),
      eventId,
      organiserCode
    })

    expect(claimed.status).toBe(422)
    expect(await errorCodeOf(claimed)).toBe('unknown_display')
  })

  it('answers 404 on a code no screen drew', async () => {
    const { eventId, organiserCode } = await openEvent()
    const claimed = await claim('ABCDEF', {
      displayId: null,
      eventId,
      organiserCode
    })

    expect(claimed.status).toBe(404)
    expect((await statusOf('ABCDEF')).status).toBe(404)
  })
})
