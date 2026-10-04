import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { MatchSetup } from '@scoreboard/protocol/event-setup'
import { matchOn, setupWith } from '@scoreboard/protocol/testing/event-setups'
import { CAMILLE } from '@scoreboard/protocol/testing/players'
import { stampedAt, started } from '@scoreboard/protocol/testing/scoring-events'

import { checkEventSetup } from './event-setup-check'
import { publicSnapshotFor, withStartsEstimatedAt } from './public-snapshot'
import { matchOnTable } from './table-queue'

const onTwoTables = (matches: MatchSetup[]) =>
  setupWith(matches, { tableCount: 2 })

describe('matchOnTable', () => {
  const first = { id: randomUUID(), status: 'finished', table: 1 } as const
  const second = { id: randomUUID(), status: 'scheduled', table: 1 } as const
  const third = { id: randomUUID(), status: 'live', table: 1 } as const

  it('[table-queue] prefers the match being played', () => {
    expect(matchOnTable([first, second, third], 1)).toBe(third.id)
  })

  it('[table-queue] falls back to the next scheduled match in order', () => {
    expect(matchOnTable([first, second], 1)).toBe(second.id)
  })

  it('[table-queue] leaves a table with nothing left empty', () => {
    expect(matchOnTable([first], 1)).toBeNull()
  })
})

describe('checkEventSetup', () => {
  it('[setup] accepts a consistent setup', () => {
    expect(checkEventSetup(onTwoTables([matchOn(1)])).status).toBe('success')
  })

  const reused = matchOn(1)

  it.each([
    [
      'a match on a table the event does not have',
      onTwoTables([matchOn(3)]),
      'table_out_of_range'
    ],
    [
      'a match naming an unknown player',
      onTwoTables([matchOn(1, { away: { playerIds: [randomUUID()] } })]),
      'unknown_player'
    ],
    [
      'a player on both sides of a match',
      onTwoTables([matchOn(1, { away: { playerIds: [CAMILLE.id] } })]),
      'player_twice_in_match'
    ],
    [
      'a display showing a table the event lacks',
      setupWith([], {
        displays: [{ id: randomUUID(), name: 'Hall B', tables: [2, 3] }],
        tableCount: 2
      }),
      'unknown_display_table'
    ],
    ['an id used twice', onTwoTables([reused, reused]), 'duplicate_id']
  ])('[setup] refuses %s', (_, setup, error) => {
    expect(checkEventSetup(setup)).toEqual({ error, status: 'failure' })
  })
})

describe('publicSnapshotFor', () => {
  it('[snapshot] puts each table on its live match', () => {
    const waiting = matchOn(1)
    const playing = matchOn(1)
    const log = [stampedAt(0, started())]

    const snapshot = publicSnapshotFor({
      logs: new Map([[playing.id, log]]),
      nowMs: 0,
      setup: onTwoTables([waiting, playing])
    })

    expect(snapshot.tables).toEqual([
      { matchId: playing.id, number: 1 },
      { matchId: null, number: 2 }
    ])
    expect(snapshot.matches[1]?.state.status).toBe('live')
  })
})

describe('withStartsEstimatedAt', () => {
  it('[snapshot] moves a waiting match’s start to the time it is now', () => {
    const waiting = matchOn(1)
    const snapshot = publicSnapshotFor({
      logs: new Map(),
      nowMs: 0,
      setup: onTwoTables([waiting])
    })

    const later = withStartsEstimatedAt(snapshot, 60_000)

    expect(later.matches[0]?.timing.estimatedStartMs).toBe(60_000)
  })
})
