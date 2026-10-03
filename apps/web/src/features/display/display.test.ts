import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { EventSetup, MatchSetup } from '@scoreboard/protocol/event-setup'
import type {
  ScoringEvent,
  StampedEvent
} from '@scoreboard/protocol/scoring-event'

import { publicSnapshotFor } from '@scoreboard/core/event/public-snapshot'

import { bestGridFor, pagesOf, tilesPerPage } from './display-fit'
import { LINGER_MS, stageTilesFor } from './display-stage'
import { displaySummaryFor, hasNotStarted } from './display-summary'

const FORMAT = { bestOf: 3, pointsPerGame: 11, sport: 'table-tennis' } as const
const camille = { id: randomUUID(), name: 'Camille Huet', teamId: null }
const louis = { id: randomUUID(), name: 'Louis Moreau', teamId: null }

const matchOn = (table: number): MatchSetup => ({
  away: { playerIds: [louis.id] },
  encounterId: null,
  format: FORMAT,
  home: { playerIds: [camille.id] },
  id: randomUUID(),
  label: null,
  plannedAtMs: null,
  table
})

const at = (recordedAtMs: number, event: ScoringEvent): StampedEvent => ({
  event,
  recordedAtMs
})

const startedAt = (recordedAtMs: number) =>
  at(recordedAtMs, {
    firstServer: 'home',
    id: randomUUID(),
    type: 'match.started'
  })

const walkoverAt = (recordedAtMs: number) =>
  at(recordedAtMs, {
    by: 'away',
    id: randomUUID(),
    reason: 'walkover',
    type: 'match.conceded'
  })

const setupWith = (matches: MatchSetup[]): EventSetup => ({
  club: null,
  defaultFormat: FORMAT,
  displays: [],
  encounters: [],
  matches,
  name: 'Club day',
  players: [camille, louis],
  startsAtMs: null,
  tableCount: 3,
  teams: []
})

const HD = { gap: 12, height: 900, width: 1460 }

describe('display fit', () => {
  it('[display] lays twelve tiles out four across and three down on a 16:9 screen', () => {
    const fit = bestGridFor({ area: HD, count: 12 })

    expect([fit.columns, fit.rows]).toEqual([4, 3])
  })

  it('[display] keeps every tile on one page while they stay legible', () => {
    expect(tilesPerPage({ area: HD, count: 12, minimumUnit: 200 })).toBe(12)
  })

  it('[display] pages twenty tiles evenly once they would get too small', () => {
    const perPage = tilesPerPage({ area: HD, count: 20, minimumUnit: 248 })

    expect(
      pagesOf(Array.from({ length: 20 }), perPage).map((page) => page.length)
    ).toEqual([10, 10])
  })
})

describe('display stage', () => {
  const live = matchOn(1)
  const finished = matchOn(2)
  const snapshotAt = (nowMs: number) =>
    publicSnapshotFor({
      logs: new Map([
        [live.id, [startedAt(0)]],
        [finished.id, [walkoverAt(10_000)]]
      ]),
      nowMs,
      setup: setupWith([live, finished, matchOn(3)])
    })

  it('[display] keeps a match that just ended on screen, then lets it go', () => {
    const tablesAt = (nowMs: number) =>
      stageTilesFor({
        nowMs,
        snapshot: snapshotAt(nowMs),
        tables: [1, 2, 3]
      }).map((tile) => tile.table)

    expect(tablesAt(10_000 + LINGER_MS - 1)).toEqual([1, 2])
    expect(tablesAt(10_000 + LINGER_MS)).toEqual([1])
  })

  it('[display] lists a table with nothing on screen with its next start', () => {
    const nowMs = 60_000
    const summary = displaySummaryFor({
      nowMs,
      onStage: [1],
      snapshot: snapshotAt(nowMs),
      tables: [1, 2, 3]
    })

    expect(summary.freeTables).toEqual([
      { nextAtMs: null, table: 2 },
      { nextAtMs: nowMs, table: 3 }
    ])
    expect(summary.results.map((match) => match.id)).toEqual([finished.id])
  })

  it('[display] waits for the first match while nothing has begun', () => {
    const snapshot = publicSnapshotFor({
      logs: new Map(),
      nowMs: 0,
      setup: setupWith([matchOn(1)])
    })

    expect(hasNotStarted(snapshot)).toBe(true)
  })
})
