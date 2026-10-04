import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import { scheduledMatchState } from '@scoreboard/protocol/match-state'
import { matchOn } from '@scoreboard/protocol/testing/event-setups'

import { followedFirst } from './followed-first'

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
