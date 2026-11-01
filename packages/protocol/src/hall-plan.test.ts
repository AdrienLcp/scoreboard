import { describe, expect, it } from 'vitest'

import { clubRecordSchema } from './club-record'
import { hallPlanSchema } from './hall-plan'

/** The club's hall of eight tables as the 12 × 12 grid kept it: a stacked pair, an empty column, three rows of two. */
const GRID_HALL = {
  tables: [
    { column: 0, isHidden: false, row: 0, table: 1 },
    { column: 0, isHidden: true, row: 1, table: 2 },
    { column: 2, isHidden: false, row: 0, table: 3 },
    { column: 3, isHidden: false, row: 0, table: 4 },
    { column: 2, isHidden: false, row: 1, table: 5 },
    { column: 3, isHidden: false, row: 1, table: 6 },
    { column: 2, isHidden: false, row: 2, table: 7 },
    { column: 3, isHidden: false, row: 2, table: 8 }
  ]
}

const recordKeeping = (hall: unknown) => ({
  hall,
  opponentColour: '#FFFFFF',
  opponents: [],
  own: {
    id: '0b8a1f2e-5c3d-4e6f-8a9b-1c2d3e4f5a6b',
    name: 'PPC Angles',
    number: null,
    players: [],
    teams: []
  }
})

describe('hall plan', () => {
  it('[hall] lays a plan kept on the old grid out in metres, neighbours touching, the empty column an aisle', () => {
    const plan = hallPlanSchema.parse(GRID_HALL)

    expect([plan.width, plan.depth]).toEqual([37, 20])
    expect(
      plan.tables.map(({ isHidden, isTurned, table, x, y }) => [
        table,
        x,
        y,
        isTurned,
        isHidden
      ])
    ).toEqual([
      [1, 2, 2, false, false],
      [2, 2, 7, false, true],
      [3, 15, 2, false, false],
      [4, 25, 2, false, false],
      [5, 15, 7, false, false],
      [6, 25, 7, false, false],
      [7, 15, 12, false, false],
      [8, 25, 12, false, false]
    ])
  })

  it('[hall] keeps a plan already in metres as it is', () => {
    const plan = {
      depth: 24,
      tables: [{ isHidden: false, isTurned: true, table: 1, x: 3.5, y: 2 }],
      width: 40
    }

    expect(hallPlanSchema.parse(plan)).toEqual(plan)
  })
})

describe('club record', () => {
  it('[club] makes the one hall a club kept its first saved plan, and the default', () => {
    const record = clubRecordSchema.parse(recordKeeping(GRID_HALL))

    expect(record).not.toHaveProperty('hall')
    expect(record.defaultPlanId).toBe('hall')
    expect(record.plans).toEqual([
      { id: 'hall', name: null, plan: hallPlanSchema.parse(GRID_HALL) }
    ])
  })

  it('[club] starts a club that kept no hall with no saved plan', () => {
    const record = clubRecordSchema.parse(recordKeeping(null))

    expect(record).not.toHaveProperty('hall')
    expect(record.defaultPlanId).toBeNull()
    expect(record.plans).toEqual([])
  })
})
