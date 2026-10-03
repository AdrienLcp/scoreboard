import { describe, expect, it } from 'vitest'

import {
  decidingGameEndChangeAt,
  gamePointHolder,
  gameWinner,
  isFinishedGame,
  isGameInProgress,
  serverOf
} from './table-tennis-game'

const TO_11 = 11

describe('gameWinner', () => {
  it('[table-tennis] gives the game at 11 with two clear points', () => {
    expect(gameWinner({ away: 9, home: 11 }, TO_11)).toBe('home')
  })

  it('[table-tennis] keeps the game going at 11-10', () => {
    expect(gameWinner({ away: 10, home: 11 }, TO_11)).toBeNull()
  })

  it('[table-tennis] gives the game past deuce with two clear points', () => {
    expect(gameWinner({ away: 14, home: 12 }, TO_11)).toBe('away')
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
  it('[table-tennis] finds the side one point from the game', () => {
    expect(gamePointHolder({ away: 4, home: 10 }, TO_11)).toBe('home')
  })

  it('[table-tennis] finds nobody at deuce', () => {
    expect(gamePointHolder({ away: 10, home: 10 }, TO_11)).toBeNull()
  })

  it('[table-tennis] finds the side ahead by one past deuce', () => {
    expect(gamePointHolder({ away: 12, home: 11 }, TO_11)).toBe('away')
  })
})

describe('decidingGameEndChangeAt', () => {
  it('[table-tennis] changes ends at 5 in a game to 11', () => {
    expect(decidingGameEndChangeAt(TO_11)).toBe(5)
  })
})
