import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import {
  type MatchState,
  scheduledMatchState
} from '@scoreboard/protocol/match-state'
import {
  BEST_OF_3,
  BEST_OF_5
} from '@scoreboard/protocol/testing/match-formats'
import {
  point,
  stampedAt,
  started,
  walkover
} from '@scoreboard/protocol/testing/scoring-events'

import { typicalMatchDurationMs } from '../match/match-log'
import { matchTimesOf } from '../match/match-times'
import { estimatedDurationMs } from './duration-estimate'
import { estimatedStartsFor, type QueuedMatch } from './start-estimate'

const MINUTE = 60_000

/** Every match lasts 20 minutes, so the expected starts can be read off the clock. */
const twentyMinutes = () => 20 * MINUTE

const queued = (overrides: Partial<QueuedMatch>): QueuedMatch => ({
  format: BEST_OF_5,
  id: randomUUID(),
  plannedAtMs: null,
  startedAtMs: null,
  status: 'scheduled',
  table: 1,
  ...overrides
})

describe('estimatedStartsFor', () => {
  const NOW = 100 * MINUTE
  const estimate = (matches: QueuedMatch[], startsAtMs: number | null = null) =>
    estimatedStartsFor({
      durationFor: twentyMinutes,
      matches,
      nowMs: NOW,
      startsAtMs
    })

  it('[timing] starts a free table’s queue now, one match after the other', () => {
    const first = queued({})
    const second = queued({})

    const estimates = estimate([first, second])

    expect([estimates.get(first.id), estimates.get(second.id)]).toEqual([
      NOW,
      NOW + 20 * MINUTE
    ])
  })

  it('[timing] waits for the live match to run what it has left', () => {
    const live = queued({ startedAtMs: NOW - 5 * MINUTE, status: 'live' })
    const next = queued({})

    const estimates = estimate([live, next])

    expect(estimates.get(next.id)).toBe(NOW + 15 * MINUTE)
  })

  it('[timing] never counts a live match that overran as already over in the past', () => {
    const live = queued({ startedAtMs: NOW - 45 * MINUTE, status: 'live' })
    const next = queued({})

    const estimates = estimate([live, next])

    expect(estimates.get(next.id)).toBe(NOW)
  })

  it('[timing] holds a match until its planned time, and the queue behind it', () => {
    const planned = queued({ plannedAtMs: NOW + 60 * MINUTE })
    const after = queued({})

    const estimates = estimate([planned, after])

    expect([estimates.get(planned.id), estimates.get(after.id)]).toEqual([
      NOW + 60 * MINUTE,
      NOW + 80 * MINUTE
    ])
  })

  it('[timing] starts nothing before the event does', () => {
    const first = queued({})

    expect(estimate([first], NOW + 30 * MINUTE).get(first.id)).toBe(
      NOW + 30 * MINUTE
    )
  })

  it('[timing] keeps each table’s queue to itself', () => {
    const tableOne = queued({ startedAtMs: NOW, status: 'live', table: 1 })
    const tableTwo = queued({ table: 2 })

    expect(estimate([tableOne, tableTwo]).get(tableTwo.id)).toBe(NOW)
  })

  it('[timing] estimates nothing for a match with no table', () => {
    const unassigned = queued({ table: null })

    expect(estimate([unassigned]).has(unassigned.id)).toBe(false)
  })
})

describe('estimatedDurationMs', () => {
  it('[timing] falls back on the ruleset’s typical length before any match is over', () => {
    expect(estimatedDurationMs({ format: BEST_OF_5, played: [] })).toBe(
      typicalMatchDurationMs(BEST_OF_5)
    )
  })

  it('[timing] expects about 24 minutes for a best of 5 to 11', () => {
    expect(typicalMatchDurationMs(BEST_OF_5)).toBe(24 * MINUTE)
  })

  it('[timing] averages the matches of the same format played here', () => {
    expect(
      estimatedDurationMs({
        format: BEST_OF_5,
        played: [
          { durationMs: 20 * MINUTE, format: BEST_OF_5 },
          { durationMs: 2 * MINUTE, format: BEST_OF_3 },
          { durationMs: 30 * MINUTE, format: BEST_OF_5 }
        ]
      })
    ).toBe(25 * MINUTE)
  })

  it('[timing] leaves out matches too short to tell the room’s pace', () => {
    expect(
      estimatedDurationMs({
        format: BEST_OF_5,
        played: [
          { durationMs: 20 * MINUTE, format: BEST_OF_5 },
          { durationMs: 30_000, format: BEST_OF_5 }
        ]
      })
    ).toBe(20 * MINUTE)
  })

  it('[timing] forgets matches older than the rolling window', () => {
    const played = [
      { durationMs: 90 * MINUTE, format: BEST_OF_5 },
      ...Array.from({ length: 8 }, () => ({
        durationMs: 20 * MINUTE,
        format: BEST_OF_5
      }))
    ]

    expect(estimatedDurationMs({ format: BEST_OF_5, played })).toBe(20 * MINUTE)
  })
})

describe('matchTimesOf', () => {
  const state = (overrides: Partial<MatchState>): MatchState => ({
    ...scheduledMatchState,
    status: 'finished',
    winner: 'home',
    ...overrides
  })

  it('[timing] times a match from its start to the event that closed it', () => {
    const log = [stampedAt(1_000, started()), stampedAt(5_000, point('home'))]

    expect(matchTimesOf(log, state({}))).toEqual({
      durationMs: 4_000,
      finishedAtMs: 5_000,
      startedAtMs: 1_000
    })
  })

  it('[timing] gives a walkover no length', () => {
    const log = [stampedAt(1_000, walkover())]

    expect(
      matchTimesOf(
        log,
        state({ concession: { by: 'away', reason: 'walkover' } })
      ).durationMs
    ).toBeNull()
  })

  it('[timing] leaves a live match unfinished', () => {
    const log = [stampedAt(1_000, started())]

    expect(matchTimesOf(log, state({ status: 'live', winner: null }))).toEqual({
      durationMs: null,
      finishedAtMs: null,
      startedAtMs: 1_000
    })
  })
})
