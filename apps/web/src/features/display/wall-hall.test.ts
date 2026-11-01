import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import {
  defaultHallPlan,
  swapHallTables
} from '@scoreboard/core/hall/hall-plan'

import type { TeamPaint } from '@/features/event/team-paint'

import { wallFloorFor, wallHallFor } from './wall-hall'
import type { WallRow } from './wall-rows'

const PAINT: TeamPaint = {
  colour: '#FFFFFF',
  isWhite: true,
  name: 'Angles 1',
  textColour: '#0E2238'
}

const rowOn = (...tables: number[]): WallRow => ({
  away: PAINT,
  home: PAINT,
  id: randomUUID(),
  matches: [],
  points: { away: 0, home: 0 },
  tables: tables.map((table) => ({
    isOver: false,
    live: null,
    next: null,
    table
  }))
})

const EIGHT_TABLES = [rowOn(1, 2), rowOn(3, 4), rowOn(5, 6), rowOn(7, 8)]

describe('wallHallFor', () => {
  it("[display] lays the club's hall on three columns, the aisle closed, the QR under the stacked pair", () => {
    const hall = wallHallFor({ plan: defaultHallPlan(8), rows: EIGHT_TABLES })

    expect(hall?.columns).toBe(3)
    expect(hall?.rows).toBe(3)
    expect(hall?.join).toEqual({ column: 1, columnSpan: 1, row: 3, rowSpan: 1 })
    expect(hall?.frames.map((frame) => frame.area)).toEqual([
      { column: 1, columnSpan: 1, row: 1, rowSpan: 2 },
      { column: 2, columnSpan: 2, row: 1, rowSpan: 1 },
      { column: 2, columnSpan: 2, row: 2, rowSpan: 1 },
      { column: 2, columnSpan: 2, row: 3, rowSpan: 1 }
    ])
    expect(hall?.frames[0]?.places.get(2)).toEqual({ column: 1, row: 2 })
  })

  it('[display] keeps the rows when the hall leaves no free place for the QR', () => {
    const hall = wallHallFor({
      plan: defaultHallPlan(8),
      rows: [rowOn(3, 4), rowOn(5, 6)]
    })

    expect(hall).toBeNull()
  })

  it('[display] gives up on the hall when an encounter is split across it', () => {
    const plan = swapHallTables(defaultHallPlan(8), 2, 8)

    expect(wallHallFor({ plan, rows: EIGHT_TABLES })).toBeNull()
  })

  it('[display] gives up on the hall when its tables do not read as rows and columns', () => {
    const plan = {
      depth: 20,
      tables: [
        { isHidden: false, isTurned: true, table: 1, x: 2, y: 0 },
        { isHidden: false, isTurned: true, table: 2, x: 2, y: 10 },
        { isHidden: false, isTurned: false, table: 3, x: 12, y: 7.5 },
        { isHidden: false, isTurned: false, table: 4, x: 22, y: 7.5 }
      ],
      width: 37
    }

    expect(wallHallFor({ plan, rows: [rowOn(1, 2), rowOn(3, 4)] })).toBeNull()
  })
})

describe('wallFloorFor', () => {
  it('[display] stands a Top 12 on six tables of the club’s hall, the aisle closed, no place left for the QR', () => {
    const floor = wallFloorFor({
      plan: defaultHallPlan(8),
      tables: [1, 2, 3, 4, 5, 6]
    })

    expect(floor).toMatchObject({ columns: 3, join: null, rows: 2 })
    expect(floor?.places.get(2)).toEqual({ column: 1, row: 2 })
    expect(floor?.places.get(6)).toEqual({ column: 3, row: 2 })
  })

  it('[display] gives the QR the free place nearest the stands on the left', () => {
    expect(
      wallFloorFor({ plan: defaultHallPlan(8), tables: [1, 3, 4, 5, 6] })?.join
    ).toEqual({ column: 1, row: 2 })
  })

  it('[display] keeps the rows when the hall is too deep to stay legible', () => {
    expect(
      wallFloorFor({ plan: defaultHallPlan(12), tables: [1, 2, 7, 8] })
    ).toBeNull()
  })
})
