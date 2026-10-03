import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { EventSetup, MatchSetup } from '@scoreboard/protocol/event-setup'

import { parsePeriodsText, periodsText } from './periods-text'
import { changeTableCount, removePlayer, tableRange } from './setup-edits'

const FORMAT = { bestOf: 5, pointsPerGame: 11, sport: 'table-tennis' } as const
const camille = { id: randomUUID(), name: 'Camille', teamId: null }
const louis = { id: randomUUID(), name: 'Louis', teamId: null }

const match: MatchSetup = {
  away: { playerIds: [louis.id] },
  encounterId: null,
  format: FORMAT,
  home: { playerIds: [camille.id] },
  id: randomUUID(),
  label: null,
  plannedAtMs: null,
  table: 3
}

const setup: EventSetup = {
  club: null,
  defaultFormat: FORMAT,
  displays: [],
  encounters: [],
  matches: [match],
  name: 'Club day',
  players: [camille, louis],
  startsAtMs: null,
  tableCount: 3,
  teams: []
}

describe('parsePeriodsText', () => {
  it('[organiser] reads games separated by spaces', () => {
    expect(parsePeriodsText(' 11-7  6–4 ')).toEqual([
      { away: 7, home: 11 },
      { away: 4, home: 6 }
    ])
  })

  it('[organiser] reads nothing typed as no game at all', () => {
    expect(parsePeriodsText('')).toEqual([])
  })

  it('[organiser] refuses a part that is not a score', () => {
    expect(parsePeriodsText('11-7 six-four')).toBeNull()
  })

  it('[organiser] writes games back the way they are typed', () => {
    expect(periodsText([{ away: 7, home: 11 }])).toBe('11-7')
  })
})

describe('setup edits', () => {
  it('[organiser] frees the seat of a removed player', () => {
    expect(removePlayer(setup, louis.id).matches[0]?.away.playerIds).toEqual([])
  })

  it('[organiser] drops a display whose tables are all gone', () => {
    const display = { id: randomUUID(), name: 'Hall B', tables: [3] }

    expect(
      changeTableCount({ ...setup, displays: [display] }, 2).displays
    ).toEqual([])
  })

  it('[organiser] lists a range of tables, both ends included', () => {
    expect(tableRange({ first: 9, last: 12 })).toEqual([9, 10, 11, 12])
  })

  it('[organiser] takes matches off the tables that are gone', () => {
    expect(changeTableCount(setup, 2).matches[0]?.table).toBeNull()
  })
})
