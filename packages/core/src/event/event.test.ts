import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { EventSetup, MatchSetup } from '@scoreboard/protocol/event-setup'
import type { StampedEvent } from '@scoreboard/protocol/scoring-event'

import { checkEventSetup } from './event-setup-check'
import { publicSnapshotFor, withStartsEstimatedAt } from './public-snapshot'
import { matchOnTable } from './table-queue'

const FORMAT = { bestOf: 3, pointsPerGame: 11, sport: 'table-tennis' } as const

const playerOne = { id: randomUUID(), name: 'Camille', teamId: null }
const playerTwo = { id: randomUUID(), name: 'Louis', teamId: null }

const matchOn = (table: number | null): MatchSetup => ({
  away: { playerIds: [playerTwo.id] },
  encounterId: null,
  format: FORMAT,
  home: { playerIds: [playerOne.id] },
  id: randomUUID(),
  label: null,
  plannedAtMs: null,
  table
})

const setupWith = (matches: MatchSetup[]): EventSetup => ({
  club: null,
  defaultFormat: FORMAT,
  displays: [],
  encounters: [],
  matches,
  name: 'Club day',
  players: [playerOne, playerTwo],
  startsAtMs: null,
  tableCount: 2,
  teams: []
})

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
    expect(checkEventSetup(setupWith([matchOn(1)])).status).toBe('success')
  })

  it('[setup] refuses a match on a table the event does not have', () => {
    expect(checkEventSetup(setupWith([matchOn(3)]))).toEqual({
      error: 'table_out_of_range',
      status: 'failure'
    })
  })

  it('[setup] refuses a match naming an unknown player', () => {
    const match = { ...matchOn(1), away: { playerIds: [randomUUID()] } }

    expect(checkEventSetup(setupWith([match]))).toEqual({
      error: 'unknown_player',
      status: 'failure'
    })
  })

  it('[setup] refuses a player on both sides of a match', () => {
    const match = { ...matchOn(1), away: { playerIds: [playerOne.id] } }

    expect(checkEventSetup(setupWith([match]))).toEqual({
      error: 'player_twice_in_match',
      status: 'failure'
    })
  })

  it('[setup] refuses a display showing a table the event lacks', () => {
    const display = { id: randomUUID(), name: 'Hall B', tables: [2, 3] }

    expect(checkEventSetup({ ...setupWith([]), displays: [display] })).toEqual({
      error: 'unknown_display_table',
      status: 'failure'
    })
  })

  it('[setup] refuses an id used twice', () => {
    const match = matchOn(1)

    expect(checkEventSetup(setupWith([match, match]))).toEqual({
      error: 'duplicate_id',
      status: 'failure'
    })
  })
})

describe('publicSnapshotFor', () => {
  it('[snapshot] puts each table on its live match', () => {
    const waiting = matchOn(1)
    const playing = matchOn(1)
    const log = [
      {
        event: { firstServer: 'home', id: randomUUID(), type: 'match.started' },
        recordedAtMs: 0
      } satisfies StampedEvent
    ]

    const snapshot = publicSnapshotFor({
      logs: new Map([[playing.id, log]]),
      nowMs: 0,
      setup: setupWith([waiting, playing])
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
      setup: setupWith([waiting])
    })

    const later = withStartsEstimatedAt(snapshot, 60_000)

    expect(later.matches[0]?.timing.estimatedStartMs).toBe(60_000)
  })
})
