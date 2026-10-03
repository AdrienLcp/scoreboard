import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { MatchState } from '@scoreboard/protocol/match-state'

import { matchCallOf } from './match-call'
import { shortName, sideName } from './participant-names'

const FORMAT = { bestOf: 5, pointsPerGame: 11, sport: 'table-tennis' } as const

const liveAt = (
  home: number,
  away: number,
  stake: MatchState['stake'] = null
): MatchState => ({
  canUndo: true,
  concession: null,
  current: { away, home },
  endsSwapped: false,
  periods: [],
  periodsWon: { away: 0, home: 0 },
  serving: 'home',
  stake,
  status: 'live',
  winner: null
})

describe('names', () => {
  it('[names] shortens a first name to its initial', () => {
    expect(shortName('Thomas Rivière')).toBe('T. Rivière')
  })

  it('[names] keeps a single name whole', () => {
    expect(shortName('Camille')).toBe('Camille')
  })

  it('[names] names a doubles pair by family names', () => {
    const pineau = { id: randomUUID(), name: 'Inès Pineau', teamId: null }
    const roux = { id: randomUUID(), name: 'Yanis Le Roux', teamId: null }

    expect(
      sideName({
        form: 'short',
        participant: { playerIds: [pineau.id, roux.id] },
        players: [pineau, roux]
      })
    ).toBe('Pineau / Roux')
  })
})

describe('match call', () => {
  it('[call] calls a match point for the side one point from the match', () => {
    expect(
      matchCallOf({
        format: FORMAT,
        state: liveAt(10, 7, { decides: 'match', side: 'home' })
      })
    ).toEqual({ kind: 'match-point', side: 'home' })
  })

  it('[call] calls deuce when the sides are level at the end of a game', () => {
    expect(matchCallOf({ format: FORMAT, state: liveAt(10, 10) })).toEqual({
      kind: 'deuce'
    })
  })

  it('[call] says nothing in the middle of a game', () => {
    expect(matchCallOf({ format: FORMAT, state: liveAt(4, 4) })).toBeNull()
  })
})
