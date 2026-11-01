import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { matchOn, setupWith } from '@scoreboard/protocol/testing/event-setups'
import { BEST_OF_5 } from '@scoreboard/protocol/testing/match-formats'
import { LOUIS } from '@scoreboard/protocol/testing/players'

import { parsePeriodsText, periodsText } from './periods-text'
import {
  addEncounter,
  changeBestOf,
  changeTableCount,
  encounterTablesOf,
  removePlayer,
  seatEncounterOnBlock,
  tableRange
} from './setup-edits'

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

describe('changeBestOf', () => {
  it('[organiser] plays one match of the sheet over seven games, leaving the others', () => {
    const first = matchOn(1)
    const second = matchOn(2)
    const changed = changeBestOf({
      bestOf: 7,
      matchId: first.id,
      setup: setupWith([first, second])
    })

    expect(changed.matches.map((match) => match.format.bestOf)).toEqual([
      7,
      second.format.bestOf
    ])
  })
})

describe('seatEncounterOnBlock', () => {
  const encounterOf = () => ({
    away: randomUUID(),
    formatId: 'fftt-6-players-20-games' as const,
    home: randomUUID(),
    id: randomUUID(),
    matchPoints: 'one-per-win' as const
  })
  const first = encounterOf()
  const second = encounterOf()
  const day = [first, second].reduce(
    (current, encounter) =>
      addEncounter({
        encounter,
        lineups: { away: {}, home: {} },
        newMatchId: randomUUID,
        setup: current
      }),
    setupWith([], { tableCount: 8 })
  )

  it('[organiser] seats odd lines on the first table of the block, even lines on the second', () => {
    const moved = seatEncounterOnBlock({
      block: [5, 6],
      encounterId: first.id,
      setup: day
    })
    const tables = moved.matches
      .filter((match) => match.encounterId === first.id)
      .map((match) => match.table)

    expect(tables.slice(0, 2)).toEqual([5, 6])
    expect(encounterTablesOf(moved, second.id)).toEqual([3, 4])
  })

  it('[organiser] swaps two encounters when one goes on the block of the other', () => {
    const moved = seatEncounterOnBlock({
      block: [3, 4],
      encounterId: first.id,
      setup: day
    })

    expect(encounterTablesOf(moved, first.id)).toEqual([3, 4])
    expect(encounterTablesOf(moved, second.id)).toEqual([1, 2])
  })
})
