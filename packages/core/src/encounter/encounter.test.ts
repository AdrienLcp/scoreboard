import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { Encounter } from '@scoreboard/protocol/event-setup'
import {
  type MatchState,
  scheduledMatchState
} from '@scoreboard/protocol/match-state'
import type { Side } from '@scoreboard/protocol/side'

import { encounterFormatFor } from './encounter-formats'
import { scoreEncounter } from './encounter-score'
import { sheetMatchesFor } from './encounter-sheet'

const FOUR_PLAYERS = encounterFormatFor('fftt-4-players-14-games')

const ENCOUNTER: Encounter = {
  away: randomUUID(),
  formatId: 'fftt-4-players-14-games',
  home: randomUUID(),
  id: randomUUID()
}

const finished = (
  winner: Side,
  concession: MatchState['concession'] = null
): MatchState => ({
  ...scheduledMatchState,
  concession,
  status: 'finished',
  winner
})

describe('FFTT sheets', () => {
  it('[encounter] plays 14 matches with 4 players, doubles after the eighth', () => {
    expect(
      FOUR_PLAYERS.sheet.map((line) =>
        line.kind === 'singles' ? `${line.home}${line.away}` : `D${line.number}`
      )
    ).toEqual([
      'AW',
      'BX',
      'CY',
      'DZ',
      'AX',
      'BW',
      'DY',
      'CZ',
      'D1',
      'D2',
      'AY',
      'CW',
      'DX',
      'BZ'
    ])
  })

  it('[encounter] plays 10 matches with 3 players', () => {
    expect(encounterFormatFor('fftt-3-players-10-games').sheet).toHaveLength(10)
  })
})

describe('sheetMatchesFor', () => {
  const homeA = randomUUID()
  const awayW = randomUUID()

  const matches = sheetMatchesFor({
    encounter: ENCOUNTER,
    format: FOUR_PLAYERS,
    lineups: { away: { W: awayW }, home: { A: homeA } },
    newMatchId: randomUUID
  })

  it('[encounter] seats each lettered player in their singles', () => {
    expect(matches[0]).toMatchObject({
      away: { playerIds: [awayW] },
      encounterId: ENCOUNTER.id,
      home: { playerIds: [homeA] },
      label: 'AW'
    })
  })

  it('[encounter] leaves a letter nobody holds empty', () => {
    expect(matches[1]).toMatchObject({
      away: { playerIds: [] },
      home: { playerIds: [] },
      label: 'BX'
    })
  })

  it('[encounter] leaves the doubles pairs to be named', () => {
    expect(matches[8]).toMatchObject({
      away: { playerIds: [] },
      label: 'Double 1'
    })
  })
})

describe('scoreEncounter', () => {
  it('[encounter] gives 2 points for a win and 1 for a loss played out', () => {
    expect(
      scoreEncounter({
        format: FOUR_PLAYERS,
        states: [finished('home'), finished('home'), finished('away')]
      })
    ).toEqual({ outcome: null, points: { away: 4, home: 5 } })
  })

  it('[encounter] gives a side that retires 1 point', () => {
    expect(
      scoreEncounter({
        format: FOUR_PLAYERS,
        states: [finished('away', { by: 'home', reason: 'retirement' })]
      }).points
    ).toEqual({ away: 2, home: 1 })
  })

  it('[encounter] gives a side that never played 0 points', () => {
    expect(
      scoreEncounter({
        format: FOUR_PLAYERS,
        states: [finished('away', { by: 'home', reason: 'walkover' })]
      }).points
    ).toEqual({ away: 2, home: 0 })
  })

  it('[encounter] calls a draw once all 14 matches end 7 apiece', () => {
    const states = [
      ...Array.from({ length: 7 }, () => finished('home')),
      ...Array.from({ length: 7 }, () => finished('away'))
    ]

    expect(scoreEncounter({ format: FOUR_PLAYERS, states })).toEqual({
      outcome: 'draw',
      points: { away: 21, home: 21 }
    })
  })
})
