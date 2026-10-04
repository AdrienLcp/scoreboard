import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { TableTennisFormat } from '@scoreboard/protocol/match-format'
import {
  type MatchState,
  scheduledMatchState
} from '@scoreboard/protocol/match-state'
import type { StampedEvent } from '@scoreboard/protocol/scoring-event'

import { typicalMatchDurationMs } from '../match/match-log'
import { matchTimesOf } from '../match/match-times'
import { estimatedDurationMs } from './duration-estimate'
import { estimatedStartsFor, type QueuedMatch } from './start-estimate'

const MINUTE = 60_000
const BEST_OF_5: TableTennisFormat = {
  bestOf: 5,
  pointsPerGame: 11,
  sport: 'table-tennis'
}
const BEST_OF_3: TableTennisFormat = { ...BEST_OF_5, bestOf: 3 }

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

  it('[timing] starts a free table’s queue now, one match after the other', () => {
    const first = queued({})
    const second = queued({})

    const estimates = estimatedStartsFor({
      durationFor: twentyMinutes,
      matches: [first, second],
      nowMs: NOW,
      startsAtMs: null
    })

    expect([estimates.get(first.id), estimates.get(second.id)]).toEqual([
      NOW,
      NOW + 20 * MINUTE
    ])
  })

  it('[timing] waits for the live match to run what it has left', () => {
    const live = queued({ startedAtMs: NOW - 5 * MINUTE, status: 'live' })
    const next = queued({})

    const estimates = estimatedStartsFor({
      durationFor: twentyMinutes,
      matches: [live, next],
      nowMs: NOW,
      startsAtMs: null
    })

    expect(estimates.get(next.id)).toBe(NOW + 15 * MINUTE)
  })

  it('[timing] never counts a live match that overran as already over in the past', () => {
    const live = queued({ startedAtMs: NOW - 45 * MINUTE, status: 'live' })
    const next = queued({})

    const estimates = estimatedStartsFor({
      durationFor: twentyMinutes,
      matches: [live, next],
      nowMs: NOW,
      startsAtMs: null
    })

    expect(estimates.get(next.id)).toBe(NOW)
  })

  it('[timing] holds a match until its planned time, and the queue behind it', () => {
    const planned = queued({ plannedAtMs: NOW + 60 * MINUTE })
    const after = queued({})

    const estimates = estimatedStartsFor({
      durationFor: twentyMinutes,
      matches: [planned, after],
      nowMs: NOW,
      startsAtMs: null
    })

    expect([estimates.get(planned.id), estimates.get(after.id)]).toEqual([
      NOW + 60 * MINUTE,
      NOW + 80 * MINUTE
    ])
  })

  it('[timing] starts nothing before the event does', () => {
    const first = queued({})

    expect(
      estimatedStartsFor({
        durationFor: twentyMinutes,
        matches: [first],
        nowMs: NOW,
        startsAtMs: NOW + 30 * MINUTE
      }).get(first.id)
    ).toBe(NOW + 30 * MINUTE)
  })

  it('[timing] keeps each table’s queue to itself', () => {
    const tableOne = queued({ startedAtMs: NOW, status: 'live', table: 1 })
    const tableTwo = queued({ table: 2 })

    expect(
      estimatedStartsFor({
        durationFor: twentyMinutes,
        matches: [tableOne, tableTwo],
        nowMs: NOW,
        startsAtMs: null
      }).get(tableTwo.id)
    ).toBe(NOW)
  })

  it('[timing] estimates nothing for a match with no table', () => {
    const unassigned = queued({ table: null })

    expect(
      estimatedStartsFor({
        durationFor: twentyMinutes,
        matches: [unassigned],
        nowMs: NOW,
        startsAtMs: null
      }).has(unassigned.id)
    ).toBe(false)
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
  const at = (
    recordedAtMs: number,
    event: StampedEvent['event']
  ): StampedEvent => ({
    event,
    recordedAtMs
  })
  const state = (overrides: Partial<MatchState>): MatchState => ({
    ...scheduledMatchState,
    status: 'finished',
    winner: 'home',
    ...overrides
  })

  it('[timing] times a match from its start to the event that closed it', () => {
    const log = [
      at(1_000, {
        firstServer: 'home',
        id: randomUUID(),
        type: 'match.started'
      }),
      at(5_000, { id: randomUUID(), side: 'home', type: 'point.scored' })
    ]

    expect(matchTimesOf(log, state({}))).toEqual({
      durationMs: 4_000,
      finishedAtMs: 5_000,
      startedAtMs: 1_000
    })
  })

  it('[timing] gives a walkover no length', () => {
    const log = [
      at(1_000, {
        by: 'away',
        id: randomUUID(),
        reason: 'walkover',
        type: 'match.conceded'
      })
    ]

    expect(
      matchTimesOf(
        log,
        state({ concession: { by: 'away', reason: 'walkover' } })
      ).durationMs
    ).toBeNull()
  })

  it('[timing] leaves a live match unfinished', () => {
    const log = [
      at(1_000, {
        firstServer: 'home',
        id: randomUUID(),
        type: 'match.started'
      })
    ]

    expect(matchTimesOf(log, state({ status: 'live', winner: null }))).toEqual({
      durationMs: null,
      finishedAtMs: null,
      startedAtMs: 1_000
    })
  })
})
