import { describe, expect, it } from 'vitest'

import type { MatchSetup } from '@scoreboard/protocol/event-setup'
import { matchOn, setupWith } from '@scoreboard/protocol/testing/event-setups'
import {
  stampedAt,
  started,
  walkover
} from '@scoreboard/protocol/testing/scoring-events'

import { publicSnapshotFor } from '@scoreboard/core/event/public-snapshot'

import { bestGridFor, pagesOf, tilesPerPage } from './display-fit'
import { LINGER_MS, stageTilesFor } from './display-stage'
import { displaySummaryFor, hasNotStarted } from './display-summary'

const onThreeTables = (matches: MatchSetup[]) =>
  setupWith(matches, { tableCount: 3 })

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
        [live.id, [stampedAt(0, started())]],
        [finished.id, [stampedAt(10_000, walkover())]]
      ]),
      nowMs,
      setup: onThreeTables([live, finished, matchOn(3)])
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
      setup: onThreeTables([matchOn(1)])
    })

    expect(hasNotStarted(snapshot)).toBe(true)
  })
})
