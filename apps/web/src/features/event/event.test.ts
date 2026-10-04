import { describe, expect, it } from 'vitest'

import {
  type MatchState,
  scheduledMatchState
} from '@scoreboard/protocol/match-state'
import { BEST_OF_5 } from '@scoreboard/protocol/testing/match-formats'
import { aPlayer } from '@scoreboard/protocol/testing/players'

import { matchCallOf } from './match-call'
import { shortName, sideName } from './participant-names'

const liveAt = (
  home: number,
  away: number,
  stake: MatchState['stake'] = null
): MatchState => ({
  ...scheduledMatchState,
  current: { away, home },
  serving: 'home',
  stake,
  status: 'live'
})

describe('names', () => {
  it('[names] shortens a first name to its initial', () => {
    expect(shortName('Thomas Rivière')).toBe('T. Rivière')
  })

  it('[names] keeps a single name whole', () => {
    expect(shortName('Camille')).toBe('Camille')
  })

  it('[names] names a doubles pair by family names', () => {
    const pineau = aPlayer('Inès Pineau')
    const roux = aPlayer('Yanis Le Roux')

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
        format: BEST_OF_5,
        state: liveAt(10, 7, { decides: 'match', side: 'home' })
      })
    ).toEqual({ kind: 'match-point', side: 'home' })
  })

  it('[call] calls deuce when the sides are level at the end of a game', () => {
    expect(matchCallOf({ format: BEST_OF_5, state: liveAt(10, 10) })).toEqual({
      kind: 'deuce'
    })
  })

  it('[call] says nothing in the middle of a game', () => {
    expect(matchCallOf({ format: BEST_OF_5, state: liveAt(4, 4) })).toBeNull()
  })
})
