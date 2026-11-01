import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { matchOn, setupWith } from '@scoreboard/protocol/testing/event-setups'
import { BEST_OF_5 } from '@scoreboard/protocol/testing/match-formats'
import { CAMILLE, LOUIS } from '@scoreboard/protocol/testing/players'

import { draftGamesOf, isDraftAccepted } from './score-draft'
import {
  addEncounter,
  changeBestOf,
  changeTableCount,
  chooseUmpire,
  encounterTablesOf,
  removePlayer,
  seatEncounterOnBlock,
  tableRange
} from './setup-edits'

const setup = setupWith([matchOn(3, { format: BEST_OF_5 })], {
  defaultFormat: BEST_OF_5,
  tableCount: 3
})

describe('score draft', () => {
  it('[organiser] reads each game as won, still on, or impossible where it stands', () => {
    expect(
      draftGamesOf(BEST_OF_5, [
        { away: 9, home: 11 },
        { away: 13, home: 11 },
        { away: 4, home: 6 }
      ])
    ).toEqual([
      { kind: 'won', side: 'home' },
      { kind: 'won', side: 'away' },
      { kind: 'playing' }
    ])
    expect(
      draftGamesOf(BEST_OF_5, [
        { away: 7, home: 6 },
        { away: 3, home: 11 }
      ])
    ).toEqual([{ kind: 'impossible' }, { kind: 'won', side: 'home' }])
  })

  it('[organiser] refuses a game after the match was won', () => {
    const won = [
      { away: 5, home: 11 },
      { away: 5, home: 11 },
      { away: 5, home: 11 }
    ]

    expect(isDraftAccepted(BEST_OF_5, won)).toBe(true)
    expect(isDraftAccepted(BEST_OF_5, [...won, { away: 1, home: 0 }])).toBe(
      false
    )
    expect(
      draftGamesOf(BEST_OF_5, [...won, { away: 1, home: 0 }]).at(-1)
    ).toEqual({ kind: 'impossible' })
  })
})

describe('setup edits', () => {
  it('[organiser] frees the seat of a removed player', () => {
    expect(removePlayer(setup, LOUIS.id).matches[0]?.away.playerIds).toEqual([])
  })

  it('[organiser] names an umpire, then hands the match back to the turn when he leaves', () => {
    const matchId = setup.matches[0]?.id ?? randomUUID()
    const chosen = chooseUmpire({ matchId, setup, umpireId: CAMILLE.id })

    expect(chosen.matches[0]?.umpireId).toBe(CAMILLE.id)
    expect(
      chooseUmpire({ matchId, setup: chosen, umpireId: null }).matches[0]
        ?.umpireId
    ).toBeNull()
    expect(
      removePlayer(chosen, CAMILLE.id).matches[0]?.umpireId
    ).toBeUndefined()
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
