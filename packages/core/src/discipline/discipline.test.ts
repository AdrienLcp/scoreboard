import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import {
  type MatchCard,
  type MatchState,
  scheduledMatchState
} from '@scoreboard/protocol/match-state'

import { nextCardPenalty } from './card-penalty'
import { runningTimeoutOf, TIMEOUT_MS } from './timeout-clock'

const PLAYER = randomUUID()
const PARTNER = randomUUID()

const withCards = (...cards: Omit<MatchCard, 'id'>[]): MatchState => ({
  ...scheduledMatchState,
  cards: cards.map((card) => ({ ...card, id: randomUUID() }))
})

const yellowFor = (playerId: string | null): Omit<MatchCard, 'id'> => ({
  penalty: 0,
  playerId,
  side: 'home'
})

describe('nextCardPenalty', () => {
  it.each([
    ['a first card is a yellow', [], 0],
    ['a second one gives a point', [yellowFor(PLAYER)], 1],
    ['a third one gives two', [yellowFor(PLAYER), yellowFor(PLAYER)], 2]
  ] as const)('[discipline] %s', (_, cards, penalty) => {
    expect(
      nextCardPenalty({
        current: withCards(...cards),
        earlier: [],
        playerId: PLAYER,
        side: 'home'
      })
    ).toBe(penalty)
  })

  it('[discipline] counts the cards a player took in his earlier matches of the encounter', () => {
    expect(
      nextCardPenalty({
        current: withCards(),
        earlier: [withCards(yellowFor(PLAYER))],
        playerId: PLAYER,
        side: 'home'
      })
    ).toBe(1)
  })

  it('[discipline] never counts a partner’s card against a player', () => {
    expect(
      nextCardPenalty({
        current: withCards(yellowFor(PARTNER)),
        earlier: [],
        playerId: PLAYER,
        side: 'home'
      })
    ).toBe(0)
  })

  it('[discipline] counts an unnamed side’s cards in this match only', () => {
    expect(
      nextCardPenalty({
        current: withCards(yellowFor(null)),
        earlier: [withCards(yellowFor(null))],
        playerId: null,
        side: 'home'
      })
    ).toBe(1)
  })
})

describe('runningTimeoutOf', () => {
  const lastTimeout = { calledAtMs: 10_000, side: 'away' } as const

  it('[discipline] counts a time-out down from its call', () => {
    expect(runningTimeoutOf({ lastTimeout, nowMs: 25_000 })).toEqual({
      ...lastTimeout,
      remainingMs: 45_000
    })
  })

  it('[discipline] stops a time-out after a minute', () => {
    expect(
      runningTimeoutOf({ lastTimeout, nowMs: 10_000 + TIMEOUT_MS })
    ).toBeNull()
  })
})
