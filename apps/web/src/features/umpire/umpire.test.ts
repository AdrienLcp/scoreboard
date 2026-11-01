import { describe, expect, it } from 'vitest'

import { BEST_OF_3 } from '@scoreboard/protocol/testing/match-formats'
import {
  card,
  confirmed,
  point,
  started,
  undo
} from '@scoreboard/protocol/testing/scoring-events'

import { connectionStateOf } from './connection-state'
import { pointHistoryOf, undoTargetSideOf } from './point-history'

describe('point history', () => {
  it('[umpire] lists points latest first with the score each one left', () => {
    const history = pointHistoryOf(BEST_OF_3, [
      started(),
      point('home'),
      point('away')
    ])

    expect(history.map((entry) => entry.scoreAfter)).toEqual([
      { away: 1, home: 1 },
      { away: 0, home: 1 }
    ])
  })

  it('[umpire] strikes the point an undo took back, and offers the one before', () => {
    const events = [started(), point('home'), point('away'), undo()]

    expect(
      pointHistoryOf(BEST_OF_3, events).map((entry) => entry.isUndone)
    ).toEqual([true, false])
    expect(undoTargetSideOf(events)).toBe('home')
  })

  it('[umpire] strikes no point when an undo takes back a validation', () => {
    const events = [
      started(),
      ...Array.from({ length: 11 }, () => point('home')),
      confirmed(),
      undo()
    ]

    expect(
      pointHistoryOf(BEST_OF_3, events).some((entry) => entry.isUndone)
    ).toBe(false)
  })

  it('[umpire] names no point when the next undo takes back a card', () => {
    expect(
      undoTargetSideOf([started(), point('home'), card({ side: 'away' })])
    ).toBeNull()
  })
})

describe('connection state', () => {
  it('[umpire] reports points waiting on the device while the socket is down', () => {
    expect(connectionStateOf({ pending: 2, status: 'closed' })).toEqual({
      kind: 'offline',
      pending: 2
    })
  })

  it('[umpire] reports points on their way once connected again', () => {
    expect(connectionStateOf({ pending: 2, status: 'open' })).toEqual({
      kind: 'sending',
      pending: 2
    })
  })
})
