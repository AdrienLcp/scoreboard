import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { MatchView } from '@scoreboard/protocol/event-snapshot'

import { followedFirst } from './followed-first'

const camille = randomUUID()
const louis = randomUUID()
const ada = randomUUID()

const between = (home: string, away: string): MatchView => ({
  away: { playerIds: [away] },
  encounterId: null,
  format: { bestOf: 3, pointsPerGame: 11, sport: 'table-tennis' },
  home: { playerIds: [home] },
  id: randomUUID(),
  label: null,
  plannedAtMs: null,
  state: {
    canUndo: false,
    concession: null,
    current: null,
    endsSwapped: false,
    periods: [],
    periodsWon: { away: 0, home: 0 },
    serving: null,
    stake: null,
    status: 'scheduled',
    winner: null
  },
  table: 1,
  timing: {
    durationMs: null,
    estimatedStartMs: null,
    finishedAtMs: null,
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
