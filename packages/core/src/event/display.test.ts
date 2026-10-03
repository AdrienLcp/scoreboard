import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { EventSetup, MatchSetup } from '@scoreboard/protocol/event-setup'
import type {
  ScoringEvent,
  StampedEvent
} from '@scoreboard/protocol/scoring-event'

import { displayBoardFor, tablesShownOn } from './display-board'
import { publicSnapshotFor } from './public-snapshot'
import { spectatorProgrammeFor } from './spectator-programme'

const FORMAT = { bestOf: 3, pointsPerGame: 11, sport: 'table-tennis' } as const
const camille = { id: randomUUID(), name: 'Camille', teamId: null }
const louis = { id: randomUUID(), name: 'Louis', teamId: null }

const matchOn = (table: number | null): MatchSetup => ({
  away: { playerIds: [louis.id] },
  encounterId: null,
  format: FORMAT,
  home: { playerIds: [camille.id] },
  id: randomUUID(),
  label: null,
  plannedAtMs: null,
  table
})

const stamped = (event: ScoringEvent): StampedEvent => ({
  event,
  recordedAtMs: 0
})

const started = stamped({
  firstServer: 'home',
  id: randomUUID(),
  type: 'match.started'
})

const walkover = stamped({
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
  tableCount: 4,
  teams: []
})

describe('tablesShownOn', () => {
  const hallB = { id: randomUUID(), name: 'Hall B', tables: [4, 3] }

  it('[display] shows every table on the default display', () => {
    expect(
      tablesShownOn({ displayId: null, displays: [hallB], tableCount: 4 })
    ).toEqual([1, 2, 3, 4])
  })

  it('[display] shows a display its own tables, in table order', () => {
    expect(
      tablesShownOn({ displayId: hallB.id, displays: [hallB], tableCount: 4 })
    ).toEqual([3, 4])
  })

  it('[display] knows no display the event does not have', () => {
    expect(
      tablesShownOn({
        displayId: randomUUID(),
        displays: [hallB],
        tableCount: 4
      })
    ).toBeNull()
  })
})

describe('displayBoardFor', () => {
  const live = matchOn(2)
  const upcoming = matchOn(1)
  const done = matchOn(3)

  const snapshot = publicSnapshotFor({
    logs: new Map([
      [live.id, [started]],
      [done.id, [walkover]]
    ]),
    nowMs: 0,
    setup: setupWith([upcoming, live, done])
  })

  const board = displayBoardFor(snapshot, [1, 2, 3, 4])

  it('[display] gives live tables the space', () => {
    expect(board.live.map((tile) => [tile.table, tile.phase])).toEqual([
      [2, 'live']
    ])
  })

  it('[display] folds every other table into the summary, in table order', () => {
    expect(board.quiet.map((tile) => [tile.table, tile.phase])).toEqual([
      [1, 'upcoming'],
      [3, 'finished'],
      [4, 'idle']
    ])
  })

  it('[display] shows a finished table its last match', () => {
    expect(board.quiet[1]?.match?.id).toBe(done.id)
  })
})

describe('spectatorProgrammeFor', () => {
  it('[spectator] sorts the day into live, upcoming and finished', () => {
    const live = matchOn(2)
    const upcoming = matchOn(null)
    const done = matchOn(1)

    const programme = spectatorProgrammeFor(
      publicSnapshotFor({
        logs: new Map([
          [live.id, [started]],
          [done.id, [walkover]]
        ]),
        nowMs: 0,
        setup: setupWith([done, live, upcoming])
      })
    )

    expect({
      finished: programme.finished.map((match) => match.id),
      live: programme.live.map((match) => match.id),
      upcoming: programme.upcoming.map((match) => match.id)
    }).toEqual({
      finished: [done.id],
      live: [live.id],
      upcoming: [upcoming.id]
    })
  })
})
