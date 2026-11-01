import { Result } from '@adrienlcp/result'
import { describe, expect, it, vi } from 'vitest'

import type { CreateEventInput } from '@scoreboard/protocol/routes'
import { matchOn } from '@scoreboard/protocol/testing/event-setups'
import { BEST_OF_3 } from '@scoreboard/protocol/testing/match-formats'
import { CAMILLE, LOUIS } from '@scoreboard/protocol/testing/players'

import { countingCode } from '@scoreboard/core/testing/counting-code'

import type { EventRooms } from './event-rooms'
import { createEvent, openEvent } from './event-service'
import { createNodeEventStore } from './testing/node-event-store'

const matchDay = (table: number): CreateEventInput => ({
  club: null,
  format: BEST_OF_3,
  hall: null,
  name: 'Round 4',
  programme: {
    encounters: [],
    matches: [matchOn(table)],
    players: [CAMILLE, LOUIS],
    teams: []
  },
  tableCount: 2
})

const roomsThatOpen = (): EventRooms => ({
  connect: vi.fn(),
  open: vi.fn(async () => Result.success()),
  vouchForWall: vi.fn()
})

describe('opening an event', () => {
  it('starts with the programme prepared for it', () => {
    const store = createNodeEventStore()
    const input = matchDay(2)

    openEvent({
      drawCode: countingCode(),
      input,
      organiserCode: 'PQRSTUVWXYZ2',
      store
    })

    expect(store.readSetup()).toMatchObject({
      matches: input.programme?.matches,
      name: 'Round 4',
      players: [CAMILLE, LOUIS]
    })
  })

  it('refuses a programme that does not hold together, before drawing an id', async () => {
    const rooms = roomsThatOpen()
    const created = await createEvent({
      drawCode: countingCode(),
      input: matchDay(3),
      rooms
    })

    expect(created).toEqual(Result.failure('invalid_programme'))
    expect(rooms.open).not.toHaveBeenCalled()
  })
})
