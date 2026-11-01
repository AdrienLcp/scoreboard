import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { MatchSetup, Team } from '@scoreboard/protocol/event-setup'
import { matchOn, setupWith } from '@scoreboard/protocol/testing/event-setups'

import { publicSnapshotFor } from '@scoreboard/core/event/public-snapshot'

import { screenSketchOf } from './screen-sketch'

const HOME: Team = { colour: '#007A42', id: randomUUID(), name: 'Angles 4' }
const AWAY: Team = { colour: null, id: randomUUID(), name: 'Nantes 2' }
const EIGHT_TABLES = [1, 2, 3, 4, 5, 6, 7, 8]

const encounterOn = (...tables: number[]) => {
  const id = randomUUID()

  return {
    encounter: {
      away: AWAY.id,
      formatId: 'fftt-6-players-20-games' as const,
      home: HOME.id,
      id,
      matchPoints: 'one-per-win' as const
    },
    matches: tables.map((table) => matchOn(table, { encounterId: id }))
  }
}

const snapshotOf = (
  encounters: ReturnType<typeof encounterOn>[],
  matches: MatchSetup[] = []
) =>
  publicSnapshotFor({
    logs: new Map(),
    nowMs: 0,
    setup: setupWith(
      [...encounters.flatMap((encounter) => encounter.matches), ...matches],
      {
        encounters: encounters.map(({ encounter }) => encounter),
        tableCount: 8,
        teams: [HOME, AWAY]
      }
    )
  })

describe('screenSketchOf', () => {
  it("[organiser] draws each encounter in its home team's colour, in rows and where its tables stand", () => {
    const sketch = screenSketchOf({
      snapshot: snapshotOf([
        encounterOn(1, 2),
        encounterOn(3, 4),
        encounterOn(5, 6),
        encounterOn(7, 8)
      ]),
      tables: EIGHT_TABLES
    })

    expect(sketch.canShowHall).toBe(true)
    expect(sketch.groups.map((group) => group.tables)).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
      [7, 8]
    ])
    expect(sketch.groups[0]?.colour).toBe(HOME.colour)
    expect(sketch.hall?.columns).toBe(3)
    expect(sketch.hall?.frames[0]?.places).toEqual([
      { column: 1, row: 1 },
      { column: 1, row: 2 }
    ])
  })

  it('[organiser] says the hall cannot stand when the plan splits an encounter', () => {
    const sketch = screenSketchOf({
      snapshot: snapshotOf([
        encounterOn(1, 3),
        encounterOn(2, 4),
        encounterOn(5, 6),
        encounterOn(7, 8)
      ]),
      tables: EIGHT_TABLES
    })

    expect(sketch.canShowHall).toBe(false)
    expect(sketch.hall).toBeNull()
  })

  it('[organiser] draws the tables two by two, each where it stands, before the wall shows encounters', () => {
    const sketch = screenSketchOf({
      snapshot: snapshotOf([], [matchOn(1)]),
      tables: EIGHT_TABLES
    })

    expect(sketch.canShowHall).toBe(true)
    expect(sketch.groups.map((group) => group.tables)).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
      [7, 8]
    ])
    expect(sketch.hall?.frames).toHaveLength(8)
  })
})
