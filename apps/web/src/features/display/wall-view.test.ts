import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { defaultHallPlan } from '@scoreboard/core/hall/hall-plan'

import type { TeamPaint } from '@/features/event/team-paint'

import type { WallRow } from './wall-rows'
import { wallFloorOn, wallHallOn, wallViewOf } from './wall-view'

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
const PLAN = defaultHallPlan(8)

describe('wallViewOf', () => {
  it("[display] reads a display's own view", () => {
    expect(
      wallViewOf({ display: { view: 'encounters' }, wallView: 'hall' })
    ).toBe('encounters')
  })

  it("[display] leaves a display without a view to the plan, whatever the event's", () => {
    expect(wallViewOf({ display: {}, wallView: 'hall' })).toBeNull()
  })

  it("[display] reads the event's view on the screen showing every table", () => {
    expect(wallViewOf({ display: undefined, wallView: 'hall' })).toBe('hall')
    expect(wallViewOf({ display: undefined })).toBeNull()
  })
})

describe('wallHallOn', () => {
  it('[display] keeps one row per encounter when the screen asks for it, though the plan holds the hall', () => {
    expect(
      wallHallOn({ plan: PLAN, rows: EIGHT_TABLES, view: 'encounters' })
    ).toBeNull()
  })

  it('[display] lays the hall out when the screen asks for it', () => {
    expect(
      wallHallOn({ plan: PLAN, rows: EIGHT_TABLES, view: 'hall' })?.columns
    ).toBe(3)
  })

  it('[display] lays the hall out when the screen leaves it to a plan that holds it', () => {
    expect(
      wallHallOn({ plan: PLAN, rows: EIGHT_TABLES, view: null })
    ).not.toBeNull()
  })

  it('[display] falls back to rows when the screen asks for the hall and the plan splits an encounter', () => {
    expect(
      wallHallOn({
        plan: PLAN,
        rows: [rowOn(1, 3), rowOn(2, 4), rowOn(5, 6), rowOn(7, 8)],
        view: 'hall'
      })
    ).toBeNull()
  })
})

describe('wallFloorOn', () => {
  const TABLES = [1, 2, 3, 4]

  it("[display] keeps a tournament's pools in rows when the screen asks for them", () => {
    expect(
      wallFloorOn({ plan: PLAN, tables: TABLES, view: 'encounters' })
    ).toBeNull()
  })

  it("[display] lays a tournament's tables out as the hall otherwise", () => {
    expect(wallFloorOn({ plan: PLAN, tables: TABLES, view: 'hall' })).toEqual(
      wallFloorOn({ plan: PLAN, tables: TABLES, view: null })
    )
    expect(
      wallFloorOn({ plan: PLAN, tables: TABLES, view: null })
    ).not.toBeNull()
  })
})
