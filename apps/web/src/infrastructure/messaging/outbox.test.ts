import { describe, expect, it } from 'vitest'

import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'

import { enqueue, type Outbox, pendingEventsFor, settle } from './outbox'

const MATCH = '0b8a1f2e-5c3d-4e6f-8a9b-1c2d3e4f5a6b'
const OTHER_MATCH = '1c9b2a3f-6d4e-4f70-9bac-2d3e4f5a6b7c'

const point = (id: string): ScoringEvent => ({
  id,
  side: 'home',
  type: 'point.scored'
})

describe('outbox', () => {
  const outbox: Outbox = [
    { event: point('first'), matchId: MATCH },
    { event: point('second'), matchId: OTHER_MATCH }
  ]

  it('[outbox] keeps records in the order they were scored', () => {
    expect(
      enqueue(outbox, { event: point('third'), matchId: MATCH }).map(
        (record) => record.event.id
      )
    ).toEqual(['first', 'second', 'third'])
  })

  it('[outbox] forgets a settled record', () => {
    expect(settle(outbox, 'first').map((record) => record.event.id)).toEqual([
      'second'
    ])
  })

  it('[outbox] lists the pending events of one match', () => {
    expect(pendingEventsFor(outbox, MATCH)).toEqual([point('first')])
  })
})
