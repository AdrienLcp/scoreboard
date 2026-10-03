import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { ClientMessage } from '@scoreboard/protocol/client-message'
import type { EventSetup, MatchSetup } from '@scoreboard/protocol/event-setup'
import type { ServerMessage } from '@scoreboard/protocol/server-message'
import { PROTOCOL_VERSION } from '@scoreboard/protocol/version'

import type { Admission } from './admission'
import { openEvent } from './event-service'
import { handleFrame } from './event-session'
import type { EventStore } from './event-store'
import { createMemoryEventStore } from './memory-event-store'

const ORGANISER_CODE = 'PQRSTUVWXYZ2'
const FORMAT = { bestOf: 3, pointsPerGame: 11, sport: 'table-tennis' } as const

/** Draws `A`, then `B`… so table 1's umpire code is `ABCDEF` and table 2's `GHJKLM`. */
const countingIndex = () => {
  let next = 0

  return (size: number): number => {
    const index = next % size
    next += 1

    return index
  }
}

const openedStore = (): EventStore => {
  const store = createMemoryEventStore()

  openEvent({
    input: { format: FORMAT, name: 'Club day', tableCount: 2 },
    organiserCode: ORGANISER_CODE,
    randomIndex: countingIndex(),
    store
  })

  return store
}

const send = (
  store: EventStore,
  admission: Admission | null,
  message: ClientMessage,
  nowMs = 0
) =>
  handleFrame({
    admission,
    nowMs,
    randomIndex: countingIndex(),
    raw: JSON.stringify(message),
    store
  })

const hello = (
  credentials: Extract<ClientMessage, { type: 'hello' }>['credentials']
) =>
  ({ credentials, protocolVersion: PROTOCOL_VERSION, type: 'hello' }) as const

const camille = { id: randomUUID(), name: 'Camille', teamId: null }
const louis = { id: randomUUID(), name: 'Louis', teamId: null }

const matchOnTable = (table: number): MatchSetup => ({
  away: { playerIds: [louis.id] },
  encounterId: null,
  format: FORMAT,
  home: { playerIds: [camille.id] },
  id: randomUUID(),
  label: null,
  plannedAtMs: null,
  table
})

const programme = (matches: MatchSetup[]): EventSetup => ({
  club: null,
  defaultFormat: FORMAT,
  displays: [],
  encounters: [],
  matches,
  name: 'Club day',
  players: [camille, louis],
  startsAtMs: null,
  tableCount: 2,
  teams: []
})

const types = (replies: readonly ServerMessage[]) =>
  replies.map((reply) => reply.type)

describe('handleFrame', () => {
  it('[session] welcomes a display with the public snapshot', () => {
    const outcome = send(openedStore(), null, hello({ role: 'display' }))

    expect(outcome.admission).toEqual({ role: 'display' })
    expect(types(outcome.replies)).toEqual(['snapshot.display'])
  })

  it('[session] welcomes a spectator, read-only', () => {
    const store = openedStore()
    const outcome = send(store, null, hello({ role: 'spectator' }))

    expect(types(outcome.replies)).toEqual(['snapshot.spectator'])
    expect(
      send(
        store,
        { role: 'spectator' },
        {
          setup: programme([]),
          type: 'setup.save'
        }
      ).replies
    ).toMatchObject([{ code: 'not_allowed' }])
  })

  it('[session] seats an umpire at the table their code opens', () => {
    const outcome = send(
      openedStore(),
      null,
      hello({ code: 'GHJKLM', role: 'umpire' })
    )

    expect(outcome.admission).toEqual({ role: 'umpire', table: 2 })
  })

  it('[session] hands the organiser the setup and every table’s code', () => {
    const outcome = send(
      openedStore(),
      null,
      hello({ code: ORGANISER_CODE, role: 'organiser' })
    )

    expect(outcome.replies).toMatchObject([
      {
        snapshot: {
          tableAccesses: [
            { code: 'ABCDEF', table: 1 },
            { code: 'GHJKLM', table: 2 }
          ]
        },
        type: 'snapshot.organiser'
      }
    ])
  })

  it('[session] turns away a wrong organiser code for good', () => {
    const outcome = send(
      openedStore(),
      null,
      hello({ code: 'ABCDEFGHJKLM', role: 'organiser' })
    )

    expect(outcome).toMatchObject({
      admission: null,
      replies: [{ code: 'wrong_code', fatal: true }],
      shouldClose: true
    })
  })

  it('[session] turns away a socket on an event never opened', () => {
    const outcome = send(
      createMemoryEventStore(),
      null,
      hello({ role: 'display' })
    )

    expect(outcome.replies).toMatchObject([{ code: 'event_not_found' }])
  })

  it('[session] asks for a hello before anything else', () => {
    const outcome = send(openedStore(), null, {
      event: { id: randomUUID(), side: 'home', type: 'point.scored' },
      matchId: randomUUID(),
      type: 'match.record'
    })

    expect(outcome.replies).toMatchObject([
      { code: 'hello_expected', fatal: true }
    ])
  })

  it('[session] keeps a display from saving a setup', () => {
    const outcome = send(
      openedStore(),
      { role: 'display' },
      {
        setup: programme([]),
        type: 'setup.save'
      }
    )

    expect(outcome.replies).toMatchObject([{ code: 'not_allowed' }])
  })

  describe('with a programme saved', () => {
    const tableOneMatch = matchOnTable(1)
    const tableTwoMatch = matchOnTable(2)

    const programmedStore = (): EventStore => {
      const store = openedStore()

      send(
        store,
        { role: 'organiser' },
        {
          setup: programme([tableOneMatch, tableTwoMatch]),
          type: 'setup.save'
        }
      )

      return store
    }

    const umpireAtTableOne: Admission = { role: 'umpire', table: 1 }
    const startedId = randomUUID()

    const start = (store: EventStore) =>
      send(store, umpireAtTableOne, {
        event: { firstServer: 'home', id: startedId, type: 'match.started' },
        matchId: tableOneMatch.id,
        type: 'match.record'
      })

    it('[session] accepts the start of the match on the umpire’s table and tells every screen', () => {
      const outcome = start(programmedStore())

      expect(outcome).toMatchObject({
        isEventChanged: true,
        replies: [{ eventId: startedId, type: 'record.accepted' }]
      })
    })

    it('[session] acknowledges a resent event without changing anything', () => {
      const store = programmedStore()

      start(store)

      expect(start(store)).toMatchObject({
        isEventChanged: false,
        replies: [{ eventId: startedId, type: 'record.accepted' }]
      })
    })

    it('[session] refuses a point on another table’s match', () => {
      const pointId = randomUUID()
      const outcome = send(programmedStore(), umpireAtTableOne, {
        event: { firstServer: 'home', id: pointId, type: 'match.started' },
        matchId: tableTwoMatch.id,
        type: 'match.record'
      })

      expect(outcome.replies).toEqual([
        {
          eventId: pointId,
          reason: 'match_not_on_table',
          type: 'record.refused'
        }
      ])
    })

    it('[session] stamps a recorded event with the server’s clock', () => {
      const store = programmedStore()
      const SERVER_NOW = 1_791_000_000_000

      send(
        store,
        umpireAtTableOne,
        {
          event: {
            firstServer: 'home',
            id: randomUUID(),
            type: 'match.started'
          },
          matchId: tableOneMatch.id,
          type: 'match.record'
        },
        SERVER_NOW
      )

      expect(store.readLogs().get(tableOneMatch.id)?.[0]?.recordedAtMs).toBe(
        SERVER_NOW
      )
    })

    it('[session] lets the organiser score any match', () => {
      const outcome = send(
        programmedStore(),
        { role: 'organiser' },
        {
          event: {
            firstServer: 'away',
            id: randomUUID(),
            type: 'match.started'
          },
          matchId: tableTwoMatch.id,
          type: 'match.record'
        }
      )

      expect(outcome.isEventChanged).toBe(true)
    })

    it('[session] sends an umpire the log of the match on their table', () => {
      const store = programmedStore()

      start(store)

      const welcome = send(
        store,
        null,
        hello({ code: 'ABCDEF', role: 'umpire' })
      )

      expect(welcome.replies).toMatchObject([
        {
          snapshot: { log: [{ id: startedId }], table: 1 },
          type: 'snapshot.umpire'
        }
      ])
    })

    it('[session] refuses a setup with a match on a table the event lacks', () => {
      const outcome = send(
        programmedStore(),
        { role: 'organiser' },
        {
          setup: programme([matchOnTable(3)]),
          type: 'setup.save'
        }
      )

      expect(outcome.replies).toEqual([
        { reason: 'table_out_of_range', type: 'setup.refused' }
      ])
    })
  })
})
