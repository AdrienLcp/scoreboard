import { describe, expect, it } from 'vitest'

import {
  decidingGameEndChangeAt,
  gamePointHolder,
  gameWinner,
  isFinishedGame,
  isGameInProgress,
  serverOf,
  serveTurnOf
} from './table-tennis-game'

const TO_11 = 11

describe('gameWinner', () => {
  it.each([
    [{ away: 9, home: 11 }, 'home'],
    [{ away: 10, home: 11 }, null],
    [{ away: 14, home: 12 }, 'away']
  ])('[table-tennis] %o goes to: %s', (score, expected) => {
    expect(gameWinner(score, TO_11)).toBe(expected)
  })
})

describe('isFinishedGame', () => {
  it.each([
    [{ away: 0, home: 11 }, true],
    [{ away: 9, home: 11 }, true],
    [{ away: 10, home: 12 }, true],
    [{ away: 13, home: 15 }, true],
    [{ away: 10, home: 13 }, false],
    [{ away: 10, home: 11 }, false],
    [{ away: 5, home: 7 }, false]
  ])('[table-tennis] %o is a finished game: %s', (score, expected) => {
    expect(isFinishedGame(score, TO_11)).toBe(expected)
  })
})

describe('isGameInProgress', () => {
  it.each([
    [{ away: 0, home: 0 }, true],
    [{ away: 10, home: 10 }, true],
    [{ away: 10, home: 11 }, true],
    [{ away: 9, home: 11 }, false],
    [{ away: 3, home: 15 }, false]
  ])('[table-tennis] %o can be a game still on: %s', (score, expected) => {
    expect(isGameInProgress(score, TO_11)).toBe(expected)
  })
})

describe('serveTurnOf', () => {
  const turnAt = (home: number, away: number) =>
    serveTurnOf({ pointsPerGame: TO_11, score: { away, home } })

  it('[table-tennis] counts the first and second serve of a turn', () => {
    expect([turnAt(0, 0), turnAt(1, 0), turnAt(1, 1), turnAt(9, 8)]).toEqual([
      { serve: 1, serves: 2 },
      { serve: 2, serves: 2 },
      { serve: 1, serves: 2 },
      { serve: 2, serves: 2 }
    ])
  })

  it('[table-tennis] gives a lone serve from 10-10', () => {
    expect([turnAt(10, 10), turnAt(11, 10)]).toEqual([
      { serve: 1, serves: 1 },
      { serve: 1, serves: 1 }
    ])
  })
})

describe('serverOf', () => {
  const serverAfter = (home: number, away: number, gameIndex = 0) =>
    serverOf({
      firstServer: 'home',
      gameIndex,
      pointsPerGame: TO_11,
      score: { away, home }
    })

  it('[table-tennis] changes the serve every two points', () => {
    expect([
      serverAfter(0, 0),
      serverAfter(1, 0),
      serverAfter(1, 1),
      serverAfter(2, 1),
      serverAfter(2, 2)
    ]).toEqual(['home', 'home', 'away', 'away', 'home'])
  })

  it('[table-tennis] changes the serve every point from 10-10', () => {
    expect([
      serverAfter(10, 10),
      serverAfter(11, 10),
      serverAfter(11, 11),
      serverAfter(12, 11)
    ]).toEqual(['home', 'away', 'home', 'away'])
  })

  it('[table-tennis] gives the next game first serve to the previous receiver', () => {
    expect([serverAfter(0, 0, 1), serverAfter(0, 0, 2)]).toEqual([
      'away',
      'home'
    ])
  })
})

describe('gamePointHolder', () => {
  it.each([
    [{ away: 4, home: 10 }, 'home'],
    [{ away: 10, home: 10 }, null],
    [{ away: 12, home: 11 }, 'away']
  ])('[table-tennis] %o has a game point for: %s', (score, expected) => {
    expect(gamePointHolder(score, TO_11)).toBe(expected)
  })
})

describe('decidingGameEndChangeAt', () => {
  it('[table-tennis] changes ends at 5 in a game to 11', () => {
    expect(decidingGameEndChangeAt(TO_11)).toBe(5)
  })
})
