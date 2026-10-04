import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { ClientMessage } from '@scoreboard/protocol/client-message'
import type { MatchSetup } from '@scoreboard/protocol/event-setup'
import type { ServerMessage } from '@scoreboard/protocol/server-message'
import { matchOn, setupWith } from '@scoreboard/protocol/testing/event-setups'
import { BEST_OF_3 } from '@scoreboard/protocol/testing/match-formats'
import { point, started } from '@scoreboard/protocol/testing/scoring-events'
import { PROTOCOL_VERSION } from '@scoreboard/protocol/version'

import { countingIndex } from '@scoreboard/core/testing/counting-index'

import type { Admission } from './admission'
import { openEvent } from './event-service'
import { handleFrame } from './event-session'
import type { EventStore } from './event-store'
import { createMemoryEventStore } from './memory-event-store'

const ORGANISER_CODE = 'PQRSTUVWXYZ2'

/** Opens a two-table event whose umpire codes, drawn by {@link countingIndex}, are `ABCDEF` for table 1 and `GHJKLM` for table 2. */
const openedStore = (): EventStore => {
  const store = createMemoryEventStore()

  openEvent({
    input: { format: BEST_OF_3, name: 'Club day', tableCount: 2 },
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

const programme = (matches: MatchSetup[]) =>
  setupWith(matches, { tableCount: 2 })

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
      event: point('home'),
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
    const tableOneMatch = matchOn(1)
    const tableTwoMatch = matchOn(2)

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
    const startedEvent = started()

    const start = (store: EventStore) =>
      send(store, umpireAtTableOne, {
        event: startedEvent,
        matchId: tableOneMatch.id,
        type: 'match.record'
      })

    it('[session] accepts the start of the match on the umpire’s table and tells every screen', () => {
      const outcome = start(programmedStore())

      expect(outcome).toMatchObject({
        isEventChanged: true,
        replies: [{ eventId: startedEvent.id, type: 'record.accepted' }]
      })
    })

    it('[session] acknowledges a resent event without changing anything', () => {
      const store = programmedStore()

      start(store)

      expect(start(store)).toMatchObject({
        isEventChanged: false,
        replies: [{ eventId: startedEvent.id, type: 'record.accepted' }]
      })
    })

    it('[session] refuses a point on another table’s match', () => {
      const event = started()
      const outcome = send(programmedStore(), umpireAtTableOne, {
        event,
        matchId: tableTwoMatch.id,
        type: 'match.record'
      })

      expect(outcome.replies).toEqual([
        {
          eventId: event.id,
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
          event: started(),
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
          event: started('away'),
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
          snapshot: { log: [{ id: startedEvent.id }], table: 1 },
          type: 'snapshot.umpire'
        }
      ])
    })

    it('[session] refuses a setup with a match on a table the event lacks', () => {
      const outcome = send(
        programmedStore(),
        { role: 'organiser' },
        {
          setup: programme([matchOn(3)]),
          type: 'setup.save'
        }
      )

      expect(outcome.replies).toEqual([
        { reason: 'table_out_of_range', type: 'setup.refused' }
      ])
    })
  })
})
