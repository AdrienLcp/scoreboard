import { describe, expect, it } from 'vitest'

import { BEST_OF_3 } from '@scoreboard/protocol/testing/match-formats'
import {
  point,
  started,
  undo
} from '@scoreboard/protocol/testing/scoring-events'

import { connectionStateOf } from './connection-state'
import { lastPointSideOf, pointHistoryOf } from './point-history'

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
    const history = pointHistoryOf(BEST_OF_3, [
      started(),
      point('home'),
      point('away'),
      undo()
    ])

    expect(history.map((entry) => entry.isUndone)).toEqual([true, false])
    expect(lastPointSideOf(history)).toBe('home')
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
