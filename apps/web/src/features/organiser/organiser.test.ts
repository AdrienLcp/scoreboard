import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { matchOn, setupWith } from '@scoreboard/protocol/testing/event-setups'
import { BEST_OF_5 } from '@scoreboard/protocol/testing/match-formats'
import { LOUIS } from '@scoreboard/protocol/testing/players'

import { parsePeriodsText, periodsText } from './periods-text'
import { changeTableCount, removePlayer, tableRange } from './setup-edits'

const setup = setupWith([matchOn(3, { format: BEST_OF_5 })], {
  defaultFormat: BEST_OF_5,
  tableCount: 3
})

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
    expect(removePlayer(setup, LOUIS.id).matches[0]?.away.playerIds).toEqual([])
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
