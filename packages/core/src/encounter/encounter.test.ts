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
import { matchPointsFor } from './match-points'
import {
  forfeitedMatchesOf,
  vacantLettersOf,
  walkoversOf
} from './player-forfeit'

const ONE_PER_WIN = matchPointsFor('one-per-win')
const TWO_PER_WIN = matchPointsFor('two-per-win')

const FOUR_PLAYERS = encounterFormatFor('fftt-4-players-14-games')

const ENCOUNTER: Encounter = {
  away: randomUUID(),
  formatId: 'fftt-4-players-14-games',
  home: randomUUID(),
  id: randomUUID(),
  matchPoints: 'one-per-win'
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

  it('[encounter] plays the 6-player sheet in the order of the signed departmental D2 sheet', () => {
    expect(
      encounterFormatFor('fftt-6-players-20-games').sheet.map((line) =>
        line.kind === 'singles' ? `${line.home}${line.away}` : `D${line.number}`
      )
    ).toEqual(
      'AX DR BY ES CZ FT BX D1 AZ ER CY DT D2 FS BZ ET CX FR AY DS'.split(' ')
    )
  })

  it('[encounter] puts odd lines of the 6-player sheet in the first group, even lines in the second', () => {
    expect(
      encounterFormatFor('fftt-6-players-20-games').sheet.map(
        (line) => line.group
      )
    ).toEqual(Array.from({ length: 20 }, (_, index) => (index % 2) + 1))
  })
})

describe('sheetMatchesFor', () => {
  const homeA = randomUUID()
  const awayW = randomUUID()

  const matches = sheetMatchesFor({
    encounter: ENCOUNTER,
    format: FOUR_PLAYERS,
    lineups: { away: { W: awayW }, home: { A: homeA } },
    newMatchId: randomUUID,
    tables: [3]
  })

  it('[encounter] seats each lettered player in their singles', () => {
    expect(matches[0]).toMatchObject({
      away: { playerIds: [awayW] },
      encounterId: ENCOUNTER.id,
      home: { playerIds: [homeA] },
      label: 'AW',
      table: 3
    })
  })

  it('[encounter] runs each group of a 6-player sheet on its own table of the pair', () => {
    const tables = sheetMatchesFor({
      encounter: { ...ENCOUNTER, formatId: 'fftt-6-players-20-games' },
      format: encounterFormatFor('fftt-6-players-20-games'),
      lineups: { away: {}, home: {} },
      newMatchId: randomUUID,
      tables: [5, 6]
    }).map((match) => match.table)

    expect(tables.slice(0, 4)).toEqual([5, 6, 5, 6])
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
  it('[encounter] counts one point per match won, as the departmental sheet does', () => {
    expect(
      scoreEncounter({
        format: FOUR_PLAYERS,
        matchPoints: ONE_PER_WIN,
        states: [finished('home'), finished('home'), finished('away')]
      })
    ).toEqual({ outcome: null, points: { away: 1, home: 2 } })
  })

  it('[encounter] gives 2 points for a win and 1 for a loss played out under the two-per-win rule', () => {
    expect(
      scoreEncounter({
        format: FOUR_PLAYERS,
        matchPoints: TWO_PER_WIN,
        states: [finished('home'), finished('home'), finished('away')]
      })
    ).toEqual({ outcome: null, points: { away: 4, home: 5 } })
  })

  it('[encounter] gives a side that retires 1 point under the two-per-win rule', () => {
    expect(
      scoreEncounter({
        format: FOUR_PLAYERS,
        matchPoints: TWO_PER_WIN,
        states: [finished('away', { by: 'home', reason: 'retirement' })]
      }).points
    ).toEqual({ away: 2, home: 1 })
  })

  it('[encounter] gives a side that never played 0 points', () => {
    expect(
      scoreEncounter({
        format: FOUR_PLAYERS,
        matchPoints: TWO_PER_WIN,
        states: [finished('away', { by: 'home', reason: 'walkover' })]
      }).points
    ).toEqual({ away: 2, home: 0 })
  })

  it('[encounter] calls a draw once all 14 matches end 7 apiece', () => {
    const states = [
      ...Array.from({ length: 7 }, () => finished('home')),
      ...Array.from({ length: 7 }, () => finished('away'))
    ]

    expect(
      scoreEncounter({ format: FOUR_PLAYERS, matchPoints: ONE_PER_WIN, states })
    ).toEqual({ outcome: 'draw', points: { away: 7, home: 7 } })
  })
})

describe('forfeitedMatchesOf', () => {
  const absent = randomUUID()
  const sheet = sheetMatchesFor({
    encounter: { ...ENCOUNTER, formatId: 'fftt-3-players-10-games' },
    format: encounterFormatFor('fftt-3-players-10-games'),
    lineups: { away: { X: absent }, home: {} },
    newMatchId: randomUUID,
    tables: [1]
  })
  const views = sheet.map((match, index) => ({
    ...match,
    state: index === 0 ? finished('home') : scheduledMatchState
  }))

  it('[encounter] gives up every match still waiting for the absent player, on his side', () => {
    expect(
      forfeitedMatchesOf({
        matches: views,
        seat: { kind: 'player', playerId: absent }
      })
    ).toEqual([
      { by: 'away', matchId: sheet[3]?.id },
      { by: 'away', matchId: sheet[8]?.id }
    ])
  })

  it('[encounter] gives up the matches of a letter nobody holds, the doubles aside', () => {
    expect(vacantLettersOf({ matches: views, side: 'home' })).toEqual([
      'A',
      'B',
      'C'
    ])
    expect(vacantLettersOf({ matches: views, side: 'away' })).toEqual([
      'Y',
      'Z'
    ])
    expect(
      forfeitedMatchesOf({
        matches: views,
        seat: { kind: 'letter', letter: 'Z', side: 'away' }
      }).map((forfeit) => forfeit.matchId)
    ).toEqual([sheet[2]?.id, sheet[4]?.id, sheet[7]?.id])
  })

  it('[encounter] takes back only the walkovers the seat side gave', () => {
    const walkover = {
      ...finished('home', { by: 'away', reason: 'walkover' }),
      canUndo: true
    }
    const given = sheet.map((match, index) => ({
      ...match,
      state: [3, 8].includes(index)
        ? walkover
        : index === 1
          ? {
              ...walkover,
              concession: { by: 'away' as const, reason: 'retirement' as const }
            }
          : scheduledMatchState
    }))

    expect(
      walkoversOf({
        matches: given,
        seat: { kind: 'player', playerId: absent }
      })
    ).toEqual([sheet[3]?.id, sheet[8]?.id])
  })
})
