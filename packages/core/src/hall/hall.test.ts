import { describe, expect, it } from 'vitest'

import { setupWith } from '@scoreboard/protocol/testing/event-setups'

import { defaultTablesFor } from '../club/club-encounter'
import { encounterFormatFor } from '../encounter/encounter-formats'
import {
  blockOf,
  defaultHallPlan,
  hallPlanOf,
  placeHallTable,
  renumberHallTable,
  toggleHallTable
} from './hall-plan'

const D6 = encounterFormatFor('fftt-6-players-20-games')

const placeOf = (
  plan: ReturnType<typeof defaultHallPlan>,
  table: number
): [number, number] | undefined => {
  const found = plan.tables.find((candidate) => candidate.table === table)

  return found === undefined ? undefined : [found.column, found.row]
}

describe('hall plan', () => {
  it("[hall] lays eight tables as the club's hall: two stacked, a gap, then three rows of two", () => {
    const plan = defaultHallPlan(8)

    expect(plan.tables.map((table) => [table.column, table.row])).toEqual([
      [0, 0],
      [0, 1],
      [2, 0],
      [3, 0],
      [2, 1],
      [3, 1],
      [2, 2],
      [3, 2]
    ])
  })

  it('[hall] pairs tables 2k − 1 and 2k in a block', () => {
    expect(blockOf(1)).toEqual([1, 2])
    expect(blockOf(6)).toEqual([5, 6])
  })

  it('[hall] keeps saved places and gives a new table the first free place', () => {
    const saved = placeHallTable({
      place: { column: 5, row: 5 },
      plan: defaultHallPlan(2),
      table: 1
    })
    const plan = hallPlanOf({ hall: saved, tableCount: 3 })

    expect(placeOf(plan, 1)).toEqual([5, 5])
    expect(placeOf(plan, 3)).toEqual([0, 0])
  })

  it('[hall] swaps two tables when one is put where the other stands', () => {
    const plan = placeHallTable({
      place: { column: 3, row: 2 },
      plan: defaultHallPlan(8),
      table: 1
    })

    expect(placeOf(plan, 1)).toEqual([3, 2])
    expect(placeOf(plan, 8)).toEqual([0, 0])
  })

  it('[hall] renumbers a table by swapping places with the one that had the number', () => {
    const plan = renumberHallTable({
      number: 3,
      plan: defaultHallPlan(8),
      table: 1
    })

    expect(placeOf(plan, 3)).toEqual([0, 0])
    expect(placeOf(plan, 1)).toEqual([2, 0])
  })

  it('[hall] never seats an encounter on a table put away for the day', () => {
    const hall = toggleHallTable(defaultHallPlan(8), 2)

    expect(
      defaultTablesFor({
        format: D6,
        preferred: [1, 2],
        setup: setupWith([], { hall, tableCount: 8 })
      })
    ).toEqual([3, 4])
  })
})
