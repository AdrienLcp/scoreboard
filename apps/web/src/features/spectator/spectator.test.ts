import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import { scheduledMatchState } from '@scoreboard/protocol/match-state'
import { matchOn } from '@scoreboard/protocol/testing/event-setups'

import { encounterTotalsOf } from './encounter-totals'
import { followedFirst } from './followed-first'
import { whereaboutsOf } from './player-whereabouts'

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
