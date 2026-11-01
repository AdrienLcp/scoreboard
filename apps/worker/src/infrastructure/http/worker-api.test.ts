import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestHarness } from 'wrangler'

import {
  clubRecordSchema,
  createdClubSchema
} from '@scoreboard/protocol/club-record'
import { MAX_LOGO_BYTES, uploadedLogoSchema } from '@scoreboard/protocol/logo'
import {
  API_ROUTES,
  apiErrorResponseSchema,
  type CreatedEvent,
  createdEventSchema,
  EVENT_SOCKET_ROUTE,
  fillRoute,
  openedWallPairingSchema,
  wallPairingStatusSchema
} from '@scoreboard/protocol/routes'
import {
  organiserSnapshotMessageSchema,
  serverMessageSchema
} from '@scoreboard/protocol/server-message'
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

/** The first message the event's socket sends its organiser once they say hello. */
const firstMessageToOrganiser = async ({
  eventId,
  organiserCode
}: CreatedEvent): Promise<unknown> => {
  const upgraded = await server.fetch(
    fillRoute(EVENT_SOCKET_ROUTE, { eventId }),
    { headers: { Upgrade: 'websocket' } }
  )
  const socket = upgraded.webSocket

  if (upgraded.status !== 101 || socket === null) {
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
      credentials: { code: organiserCode, role: 'organiser' },
      protocolVersion: PROTOCOL_VERSION,
      type: 'hello'
    })
  )
  const message = await firstMessage
  socket.close()

  return message
}

/** A socket on the event, said hello as `credentials`, and every message it hears. */
const helloSocket = async (
  eventId: string,
  credentials: Record<string, unknown>
) => {
  const upgraded = await server.fetch(
    fillRoute(EVENT_SOCKET_ROUTE, { eventId }),
    { headers: { Upgrade: 'websocket' } }
  )
  const socket = upgraded.webSocket

  if (upgraded.status !== 101 || socket === null) {
    throw new Error('The upgrade carried no socket')
  }

  socket.accept()
  const heard: unknown[] = []
  const waiters: (() => void)[] = []
  socket.addEventListener('message', (message) => {
    heard.push(JSON.parse(String(message.data)))
    for (const wake of waiters.splice(0)) {
      wake()
    }
  })
  socket.send(
    JSON.stringify({
      credentials,
      protocolVersion: PROTOCOL_VERSION,
      type: 'hello'
    })
  )

  /** The first message heard, now or later, that `isWanted` accepts. */
  const nextWhere = async (isWanted: (message: unknown) => boolean) => {
    for (;;) {
      const found = heard.find(isWanted)

      if (found !== undefined) {
        heard.splice(heard.indexOf(found), 1)

        return found
      }

      await new Promise<void>((resolve) => waiters.push(resolve))
    }
  }

  return { nextWhere, socket }
}

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

    expect(
      serverMessageSchema.parse(await firstMessageToOrganiser(created)).type
    ).toBe('snapshot.organiser')
  })

  it('tells the organiser which screens a TV shows, as TVs come and go', async () => {
    const created = createdEventSchema.parse(
      await (
        await postEvent(
          JSON.stringify({ format: BEST_OF_3, name: 'Club day', tableCount: 2 })
        )
      ).json()
    )
    const organiser = await helloSocket(created.eventId, {
      code: created.organiserCode,
      role: 'organiser'
    })
    const screensHeard = (expected: unknown) => (message: unknown) => {
      const parsed = organiserSnapshotMessageSchema.safeParse(message)

      return (
        parsed.success &&
        JSON.stringify(parsed.data.snapshot.connectedScreens) ===
          JSON.stringify(expected)
      )
    }

    await organiser.nextWhere(screensHeard([]))
    const tv = await helloSocket(created.eventId, {
      displayId: null,
      role: 'display'
    })

    await expect(
      organiser.nextWhere(screensHeard([{ displayId: null, tvCount: 1 }]))
    ).resolves.toBeDefined()

    tv.socket.close()

    await expect(organiser.nextWhere(screensHeard([]))).resolves.toBeDefined()
    organiser.socket.close()
  })

  it("opens an event with the club's name, logo and hall the device sends", async () => {
    const club = {
      colours: null,
      logoUrl: '/api/logos/room/logo',
      name: 'PPC Angles'
    }
    const hall = {
      depth: 20,
      tables: [
        { isHidden: false, isTurned: false, table: 1, x: 2, y: 2 },
        { isHidden: true, isTurned: true, table: 2, x: 12, y: 2 }
      ],
      width: 37
    }
    const created = createdEventSchema.parse(
      await (
        await postEvent(
          JSON.stringify({
            club,
            format: BEST_OF_3,
            hall,
            name: 'Club day',
            tableCount: 2
          })
        )
      ).json()
    )
    const { setup } = organiserSnapshotMessageSchema.parse(
      await firstMessageToOrganiser(created)
    ).snapshot

    expect(setup.club).toEqual(club)
    expect(setup.hall).toEqual(hall)
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

describe('the club store', () => {
  const json = { 'Content-Type': 'application/json' }

  const openClub = async () =>
    createdClubSchema.parse(
      await (
        await server.fetch(API_ROUTES.clubs, {
          body: JSON.stringify({ name: 'PPC Angles' }),
          headers: json,
          method: 'POST'
        })
      ).json()
    )

  const readClub = (clubCode: string) =>
    server.fetch(fillRoute(API_ROUTES.club, { clubCode }))

  it('opens a club under its code and gives it back on any device', async () => {
    const { clubCode } = await openClub()
    const record = clubRecordSchema.parse(
      await (await readClub(clubCode)).json()
    )

    expect(record.own.name).toBe('PPC Angles')
    expect(record.own.teams).toEqual([])
  })

  it('keeps the record the club saves', async () => {
    const { clubCode } = await openClub()
    const record = clubRecordSchema.parse(
      await (await readClub(clubCode)).json()
    )
    const renamed = { ...record, own: { ...record.own, number: '12850078' } }
    const saved = await server.fetch(fillRoute(API_ROUTES.club, { clubCode }), {
      body: JSON.stringify(renamed),
      headers: json,
      method: 'PUT'
    })

    expect(saved.status).toBe(204)
    expect(
      clubRecordSchema.parse(
        await (await readClub(clubCode.toLowerCase())).json()
      ).own.number
    ).toBe('12850078')
  })

  it('answers 404 on a code no club holds', async () => {
    expect((await readClub('ABCDEFGHJKLM')).status).toBe(404)
  })
})

describe('the club logos', () => {
  const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3])

  const openClub = async () =>
    createdClubSchema.parse(
      await (
        await server.fetch(API_ROUTES.clubs, {
          body: JSON.stringify({ name: 'PPC Angles' }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST'
        })
      ).json()
    ).clubCode

  const upload = (
    clubCode: string,
    body: Uint8Array,
    contentType = 'image/png'
  ) =>
    server.fetch(fillRoute(API_ROUTES.clubLogos, { clubCode }), {
      body,
      headers: { 'Content-Type': contentType },
      method: 'POST'
    })

  const uploadedLogoUrl = async (clubCode: string) =>
    uploadedLogoSchema.parse(await (await upload(clubCode, pngBytes)).json())
      .logoUrl

  const showLogo = async (clubCode: string, logoUrl: string) => {
    const club = fillRoute(API_ROUTES.club, { clubCode })
    const record = clubRecordSchema.parse(
      await (await server.fetch(club)).json()
    )

    await server.fetch(club, {
      body: JSON.stringify({ ...record, own: { ...record.own, logoUrl } }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT'
    })
  }

  it('keeps an uploaded logo and serves it to anyone, cached for good', async () => {
    const clubCode = await openClub()
    const uploaded = await upload(clubCode, pngBytes)

    expect(uploaded.status).toBe(201)

    const { logoUrl } = uploadedLogoSchema.parse(await uploaded.json())

    expect(logoUrl).not.toContain(clubCode)

    const served = await server.fetch(logoUrl)

    expect(served.status).toBe(200)
    expect(served.headers.get('Content-Type')).toBe('image/png')
    expect(served.headers.get('Cache-Control')).toBe(
      'public, max-age=31536000, immutable'
    )
    expect(served.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(new Uint8Array(await served.arrayBuffer())).toEqual(pngBytes)
  })

  it.each([
    ['an image type the wall does not take', pngBytes, 'image/svg+xml'],
    ['an empty image', new Uint8Array(), 'image/png'],
    [
      'an image over the size limit',
      new Uint8Array(MAX_LOGO_BYTES + 1),
      'image/png'
    ]
  ])('refuses %s', async (_, body, contentType) => {
    const refused = await upload(await openClub(), body, contentType)

    expect(refused.status).toBe(400)
    expect(await errorCodeOf(refused)).toBe('invalid_input')
  })

  it('answers 404 on an upload to a code no club holds', async () => {
    const refused = await upload('ABCDEFGHJKLM', pngBytes)

    expect(refused.status).toBe(404)
    expect(await errorCodeOf(refused)).toBe('not_found')
  })

  it.each([
    ['a malformed room id', 'not-a-room'],
    ['a room id no club drew', '0'.repeat(64)]
  ])('answers 404 on a logo behind %s', async (_, roomId) => {
    const served = await server.fetch(
      fillRoute(API_ROUTES.logo, { logoId: crypto.randomUUID(), roomId })
    )

    expect(served.status).toBe(404)
  })

  it('answers 404 on a logo its club never stored', async () => {
    const logoUrl = await uploadedLogoUrl(await openClub())
    const unknownLogoUrl = logoUrl.replace(/[^/]+$/, crypto.randomUUID())

    expect((await server.fetch(unknownLogoUrl)).status).toBe(404)
  })

  it('keeps a fresh logo the record does not show yet beside the one it shows', async () => {
    const clubCode = await openClub()
    const shown = await uploadedLogoUrl(clubCode)
    await showLogo(clubCode, shown)
    const unsaved = await uploadedLogoUrl(clubCode)
    const latest = await uploadedLogoUrl(clubCode)

    expect((await server.fetch(shown)).status).toBe(200)
    expect((await server.fetch(unsaved)).status).toBe(200)
    expect((await server.fetch(latest)).status).toBe(200)
  })
})
