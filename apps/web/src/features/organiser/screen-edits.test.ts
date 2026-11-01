import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { Display } from '@scoreboard/protocol/event-setup'
import { setupWith } from '@scoreboard/protocol/testing/event-setups'

import {
  nextShareOf,
  tableSharesOf,
  withDisplayTables,
  withNewDisplay,
  withScreenView
} from './screen-edits'

const HALL_B: Display = { id: randomUUID(), name: 'Hall B', tables: [5, 6] }
const EIGHT_TABLES = setupWith([], { tableCount: 8 })

describe('withScreenView', () => {
  it("[organiser] sets the event's view for the screen showing every table", () => {
    expect(withScreenView(EIGHT_TABLES, null, 'encounters').wallView).toBe(
      'encounters'
    )
  })

  it("[organiser] sets a display's own view, the event's untouched", () => {
    const setup = withScreenView(
      { ...EIGHT_TABLES, displays: [HALL_B] },
      HALL_B.id,
      'hall'
    )

    expect(setup.displays[0]?.view).toBe('hall')
    expect(setup.wallView).toBeUndefined()
  })
})

describe('withDisplayTables', () => {
  it('[organiser] changes the tables a display shows', () => {
    expect(
      withDisplayTables(
        { ...EIGHT_TABLES, displays: [HALL_B] },
        HALL_B.id,
        [1, 2, 3, 4]
      ).displays[0]?.tables
    ).toEqual([1, 2, 3, 4])
  })
})

describe('tableSharesOf', () => {
  it('[organiser] offers every table, each half, then each third', () => {
    expect(tableSharesOf(8)).toEqual([
      [1, 2, 3, 4, 5, 6, 7, 8],
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [1, 2],
      [3, 4, 5],
      [6, 7, 8]
    ])
  })

  it('[organiser] offers halves alone below six tables, and the table alone in a one-table hall', () => {
    expect(tableSharesOf(4)).toEqual([
      [1, 2, 3, 4],
      [1, 2],
      [3, 4]
    ])
    expect(tableSharesOf(1)).toEqual([[1]])
  })
})

describe('nextShareOf', () => {
  it('[organiser] gives a new screen the first half nobody shows yet', () => {
    expect(nextShareOf(EIGHT_TABLES)).toEqual([1, 2, 3, 4])
    expect(
      nextShareOf({
        ...EIGHT_TABLES,
        displays: [{ ...HALL_B, tables: [1, 2, 3, 4] }]
      })
    ).toEqual([5, 6, 7, 8])
  })

  it('[organiser] gives every table once each share is shown', () => {
    expect(nextShareOf(setupWith([], { tableCount: 1 }))).toEqual([1])
  })
})

describe('withNewDisplay', () => {
  it('[organiser] adds a screen on the next share, named as asked', () => {
    const id = randomUUID()

    expect(
      withNewDisplay(EIGHT_TABLES, { id, name: 'Hall B' }).displays
    ).toEqual([{ id, name: 'Hall B', tables: [1, 2, 3, 4] }])
  })
})
