import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { MatchSetup } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { HallPlan } from '@scoreboard/protocol/hall-plan'
import { scheduledMatchState } from '@scoreboard/protocol/match-state'
import { matchOn, setupWith } from '@scoreboard/protocol/testing/event-setups'
import { stampedAt, started } from '@scoreboard/protocol/testing/scoring-events'

import { publicSnapshotFor } from '@scoreboard/core/event/public-snapshot'
import { defaultHallPlan } from '@scoreboard/core/hall/hall-plan'

import { encounterTotalsOf } from './encounter-totals'
import { followedFirst } from './followed-first'
import { whereaboutsOf } from './player-whereabouts'
import { roomLayoutOf } from './room-layout'

const camille = randomUUID()
const louis = randomUUID()
const ada = randomUUID()

const between = (home: string, away: string): MatchView => ({
  ...matchOn(1, { away: { playerIds: [away] }, home: { playerIds: [home] } }),
  state: scheduledMatchState,
  timing: {
    durationMs: null,
    estimatedStartMs: null,
    finishedAtMs: null,
    lastTimeout: null,
    startedAtMs: null
  }
})

describe('followed first', () => {
  it('[spectator] puts a followed player’s matches first, keeping the order of both groups', () => {
    const first = between(camille, louis)
    const second = between(ada, louis)
    const third = between(ada, camille)

    const split = followedFirst([first, second, third], [camille])

    expect(split.followed).toEqual([first, third])
    expect(split.others).toEqual([second])
  })
})

describe('player whereabouts', () => {
  it('[spectator] tells a registered player placed in no match yet apart from one whose matches are over', () => {
    const programme = {
      finished: [between(camille, louis)],
      live: [],
      upcoming: []
    }

    expect(whereaboutsOf(ada, programme)).toEqual({ status: 'unplaced' })
    expect(whereaboutsOf(camille, programme)).toEqual({ status: 'finished' })
  })

  it('[spectator] finds a player at the live table before their upcoming matches', () => {
    const live = between(camille, louis)
    const programme = {
      finished: [],
      live: [live],
      upcoming: [between(camille, ada)]
    }

    expect(whereaboutsOf(camille, programme)).toEqual({
      status: 'live',
      table: live.table
    })
    expect(whereaboutsOf(ada, programme)).toEqual({ status: 'upcoming' })
  })
})

describe('encounter totals', () => {
  it('[spectator] adds up parties, games and points won over the finished matches', () => {
    const won: MatchView = {
      ...between(camille, louis),
      state: {
        ...scheduledMatchState,
        periods: [
          { away: 7, home: 11 },
          { away: 11, home: 9 },
          { away: 5, home: 11 },
          { away: 8, home: 11 }
        ],
        periodsWon: { away: 1, home: 3 },
        status: 'finished',
        winner: 'home'
      }
    }

    expect(encounterTotalsOf([won, between(ada, louis)])).toEqual({
      away: { games: 1, parties: 0, points: 31 },
      home: { games: 3, parties: 1, points: 42 }
    })
  })
})

const CLUB_HALL = defaultHallPlan(8)

const putAway = (...tables: number[]): HallPlan => ({
  tables: CLUB_HALL.tables.map((table) => ({
    ...table,
    isHidden: tables.includes(table.table)
  }))
})

const hallDay = ({
  hall,
  live = [],
  matches,
  tableCount = 8
}: {
  hall: HallPlan | null
  live?: MatchSetup[]
  matches: MatchSetup[]
  tableCount?: number
}) =>
  publicSnapshotFor({
    logs: new Map(live.map((match) => [match.id, [stampedAt(1, started())]])),
    nowMs: 1000,
    setup: setupWith(matches, { hall, tableCount })
  })

describe('room layout', () => {
  it('[spectator] draws the club’s hall without a table put away, its aisle kept', () => {
    const layout = roomLayoutOf(hallDay({ hall: putAway(8), matches: [] }))

    expect(layout.columns).toEqual([true, false, true, true])
    expect(layout.rows).toBe(3)
    expect(layout.tables.map((table) => table.table)).toEqual([
      1, 2, 3, 4, 5, 6, 7
    ])
    expect(layout.tables[2]).toMatchObject({ column: 3, row: 1, table: 3 })
  })

  it('[spectator] closes up a row and an edge column nobody stands on', () => {
    const layout = roomLayoutOf(
      hallDay({ hall: putAway(1, 2, 5, 6), matches: [] })
    )

    expect(layout.columns).toEqual([true, true])
    expect(layout.rows).toBe(2)
    expect(layout.tables).toMatchObject([
      { column: 1, row: 1, table: 3 },
      { column: 2, row: 1, table: 4 },
      { column: 1, row: 2, table: 7 },
      { column: 2, row: 2, table: 8 }
    ])
  })

  it('[spectator] gives a table the match played on it, a free one the match it waits for', () => {
    const playing = matchOn(1)
    const awaited = matchOn(2)
    const layout = roomLayoutOf(
      hallDay({ hall: null, live: [playing], matches: [playing, awaited] })
    )

    expect(layout.tables[0]).toMatchObject({
      live: { id: playing.id },
      next: null
    })
    expect(layout.tables[1]).toMatchObject({
      live: null,
      next: { id: awaited.id }
    })
    expect(layout.tables[2]).toMatchObject({ live: null, next: null })
  })
})
