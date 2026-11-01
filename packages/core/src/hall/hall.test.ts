import { describe, expect, it } from 'vitest'

import type { HallPlan } from '@scoreboard/protocol/hall-plan'
import { setupWith } from '@scoreboard/protocol/testing/event-setups'

import { defaultTablesFor } from '../club/club-encounter'
import { encounterFormatFor } from '../encounter/encounter-formats'
import {
  areAdjacent,
  areaOf,
  areasOverlap,
  blockOf,
  defaultHallPlan,
  deleteHallTable,
  hallGridOf,
  hallPlanOf,
  hallTableOf,
  isHiddenIn,
  moveHallTables,
  putAwayHallTables,
  putBackHallTable,
  reservedTablesOf,
  standingTablesOf,
  swapHallTables,
  turnHallTable
} from './hall-plan'

const D6 = encounterFormatFor('fftt-6-players-20-games')

const placeOf = (plan: HallPlan, table: number) => {
  const found = hallTableOf(plan, table)

  return found === undefined
    ? undefined
    : { isTurned: found.isTurned, x: found.x, y: found.y }
}

const at = (x: number, y: number, isTurned = false) => ({ isTurned, x, y })

/** The plan an edit gave; a `null`, when the hall had no room for it, fails the test. */
const roomMade = (plan: HallPlan | null): HallPlan => {
  if (plan === null) {
    throw new Error('the hall had no room for this edit')
  }

  return plan
}

const standingClearOfEachOther = (plan: HallPlan): boolean =>
  standingTablesOf(plan).every((table) =>
    standingTablesOf(plan, [table.table]).every(
      (other) => !areasOverlap(areaOf(table), areaOf(other))
    )
  )

describe('hall plan', () => {
  it("[hall] lays eight tables as the club's hall: two stacked, an aisle, then three rows of two", () => {
    const plan = defaultHallPlan(8)

    expect([plan.width, plan.depth]).toEqual([37, 20])
    expect(plan.tables.map((table) => placeOf(plan, table.table))).toEqual([
      at(2, 4.5),
      at(2, 9.5),
      at(15, 2),
      at(25, 2),
      at(15, 7),
      at(25, 7),
      at(15, 12),
      at(25, 12)
    ])
  })

  it('[hall] stacks the tables of any other count by block, three blocks a row, clear of each other', () => {
    const plan = defaultHallPlan(12)

    expect(placeOf(plan, 1)).toEqual(at(2, 2))
    expect(placeOf(plan, 2)).toEqual(at(2, 7))
    expect(placeOf(plan, 3)).toEqual(at(13.5, 2))
    expect(placeOf(plan, 7)).toEqual(at(2, 14))
    expect(plan.depth).toBe(26)
    expect(standingClearOfEachOther(plan)).toBe(true)
  })

  it('[hall] pairs tables 2k − 1 and 2k in a block', () => {
    expect(blockOf(1)).toEqual([1, 2])
    expect(blockOf(6)).toEqual([5, 6])
  })

  it('[hall] keeps saved places, drops the tables past the count and puts a new one at the free spot', () => {
    const saved = roomMade(
      moveHallTables({
        plan: defaultHallPlan(2),
        shiftX: 20,
        shiftY: 0,
        tables: [1]
      })
    )
    const plan = hallPlanOf({ hall: saved, tableCount: 3 })

    expect(placeOf(plan, 1)).toEqual(at(22, 2))
    expect(placeOf(plan, 3)).toEqual(at(2, 12))
    expect(
      hallPlanOf({ hall: plan, tableCount: 1 }).tables.map(
        (table) => table.table
      )
    ).toEqual([1])
  })

  it('[hall] swaps two tables, each taking the other’s place', () => {
    const plan = swapHallTables(defaultHallPlan(8), 1, 8)

    expect(placeOf(plan, 1)).toEqual(at(25, 12))
    expect(placeOf(plan, 8)).toEqual(at(2, 4.5))
  })

  it('[hall] turns a block as one: both tables turn and stay against each other, twice gives it back', () => {
    const stacked = defaultHallPlan(2)
    const turned = roomMade(turnHallTable(stacked, 2))

    expect(placeOf(turned, 1)).toEqual(at(2, 2, true))
    expect(placeOf(turned, 2)).toEqual(at(7, 2, true))

    const [first, second] = turned.tables

    expect(
      first !== undefined &&
        second !== undefined &&
        areAdjacent(areaOf(first), areaOf(second))
    ).toBe(true)
    expect(turnHallTable(turned, 1)).toEqual(stacked)
  })

  it('[hall] turns a table standing apart from its partner alone, about its centre', () => {
    const apart = roomMade(
      moveHallTables({
        plan: defaultHallPlan(2),
        shiftX: 20,
        shiftY: 0,
        tables: [2]
      })
    )
    const turned = roomMade(turnHallTable(apart, 1))

    expect(placeOf(turned, 1)).toEqual(at(4.5, 0, true))
    expect(placeOf(turned, 2)).toEqual(at(22, 7))
  })

  it('[hall] puts a table away for the day and back to its place', () => {
    const away = putAwayHallTables(defaultHallPlan(8), [2])

    expect(isHiddenIn(away, 2)).toBe(true)
    expect(standingTablesOf(away).map((table) => table.table)).not.toContain(2)
    expect(reservedTablesOf(away).map((table) => table.table)).toEqual([2])

    const back = roomMade(putBackHallTable({ plan: away, table: 2 }))

    expect(hallTableOf(back, 2)).toEqual({
      isHidden: false,
      isTurned: false,
      table: 2,
      x: 2,
      y: 9.5
    })
  })

  it('[hall] puts a table back at the nearest free place when another took its own', () => {
    const away = putAwayHallTables(defaultHallPlan(8), [2])
    const taken = roomMade(
      moveHallTables({ plan: away, shiftX: 0, shiftY: 5, tables: [1] })
    )
    const back = roomMade(putBackHallTable({ plan: taken, table: 2 }))

    expect(placeOf(back, 1)).toEqual(at(2, 9.5))
    expect(placeOf(back, 2)).toEqual(at(2, 4.5))
    expect(standingClearOfEachOther(back)).toBe(true)
  })

  it('[hall] settles a table dropped over another against it, and sends it back when no place is near', () => {
    const dropped = moveHallTables({
      plan: defaultHallPlan(2),
      shiftX: 0,
      shiftY: 6,
      tables: [1]
    })

    expect(dropped === null ? null : placeOf(dropped, 1)).toEqual(at(2, 12))
    expect(
      moveHallTables({
        plan: defaultHallPlan(8),
        shiftX: 13,
        shiftY: -2.5,
        tables: [1]
      })
    ).toBeNull()
  })

  it('[hall] renumbers 1 to N on a deletion, whole blocks first, a table left alone last', () => {
    const before = defaultHallPlan(8)
    const { numbers, plan } = deleteHallTable(before, 3)

    expect([...numbers]).toEqual([
      [1, 1],
      [2, 2],
      [5, 3],
      [6, 4],
      [7, 5],
      [8, 6],
      [4, 7]
    ])
    expect(plan.tables.map((table) => table.table)).toEqual([
      1, 2, 3, 4, 5, 6, 7
    ])
    expect(placeOf(plan, 3)).toEqual(placeOf(before, 5))
    expect(placeOf(plan, 7)).toEqual(placeOf(before, 4))
  })

  it("[hall] reads the club's hall as three columns and three rows, the stacked pair on the left", () => {
    const grid = hallGridOf(defaultHallPlan(8))

    expect(grid).toMatchObject({ columns: 3, rows: 3 })
    expect(grid?.places).toEqual(
      new Map([
        [1, { column: 0, row: 0 }],
        [2, { column: 0, row: 1 }],
        [3, { column: 1, row: 0 }],
        [4, { column: 2, row: 0 }],
        [5, { column: 1, row: 1 }],
        [6, { column: 2, row: 1 }],
        [7, { column: 1, row: 2 }],
        [8, { column: 2, row: 2 }]
      ])
    )
  })

  it('[hall] reads a turned table beside a stacked pair in one of their rows, whatever the numbers', () => {
    const grid = hallGridOf({
      depth: 20,
      tables: [
        { isHidden: false, isTurned: true, table: 1, x: 20, y: 2 },
        { isHidden: false, isTurned: false, table: 2, x: 2, y: 2 },
        { isHidden: false, isTurned: false, table: 3, x: 2, y: 7 }
      ],
      width: 37
    })

    expect(grid?.places.get(1)).toEqual({ column: 1, row: 0 })
    expect(grid?.places.get(2)).toEqual({ column: 0, row: 0 })
    expect(grid?.places.get(3)).toEqual({ column: 0, row: 1 })
  })

  it('[hall] gives up reading rows and columns when two tables would share a cell', () => {
    expect(
      hallGridOf({
        depth: 20,
        tables: [
          { isHidden: false, isTurned: true, table: 1, x: 2, y: 0 },
          { isHidden: false, isTurned: true, table: 2, x: 2, y: 10 },
          { isHidden: false, isTurned: false, table: 3, x: 12, y: 7.5 }
        ],
        width: 37
      })
    ).toBeNull()
  })

  it('[hall] never seats an encounter on a table put away for the day', () => {
    const hall = putAwayHallTables(defaultHallPlan(8), [2])

    expect(
      defaultTablesFor({
        format: D6,
        preferred: [1, 2],
        setup: setupWith([], { hall, tableCount: 8 })
      })
    ).toEqual([3, 4])
  })
})
