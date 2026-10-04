import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'
import type { Side } from '@scoreboard/protocol/side'
import { BEST_OF_5 } from '@scoreboard/protocol/testing/match-formats'
import {
  correction,
  point,
  retirement,
  started,
  undo,
  walkover
} from '@scoreboard/protocol/testing/scoring-events'

import { describeMatch, recordScoringEvent } from './match-log'

/** `'hha'` is two points for home then one for away. */
const rally = (sequence: string): ScoringEvent[] =>
  [...sequence].map((letter) => point(letter === 'h' ? 'home' : 'away'))

/** The points of a game won to `loserScore`, the winner scoring last. */
const gameTo = (winner: Side, loserScore: number): ScoringEvent[] => {
  const loser = winner === 'home' ? 'a' : 'h'
  const win = winner === 'home' ? 'h' : 'a'
  const isPastDeuce = loserScore >= 10

  return rally(
    isPastDeuce
      ? `${loser}${win}`.repeat(loserScore) + win.repeat(2)
      : loser.repeat(loserScore) + win.repeat(11)
  )
}

const stateOf = (log: readonly ScoringEvent[]) => describeMatch(BEST_OF_5, log)

describe('describeMatch', () => {
  it('[match-log] leaves a match with no start scheduled', () => {
    expect(stateOf([]).status).toBe('scheduled')
  })

  it('[match-log] counts points in the current game', () => {
    const state = stateOf([started(), ...rally('hha')])

    expect(state).toMatchObject({
      current: { away: 1, home: 2 },
      periods: [],
      status: 'live'
    })
  })

  it('[match-log] closes a game at 11-9 and opens the next at 0-0', () => {
    const state = stateOf([started(), ...gameTo('home', 9)])

    expect(state).toMatchObject({
      current: { away: 0, home: 0 },
      periods: [{ away: 9, home: 11 }],
      periodsWon: { away: 0, home: 1 }
    })
  })

  it('[match-log] gives the match to the first side to three games in a best of five', () => {
    const state = stateOf([
      started(),
      ...gameTo('away', 5),
      ...gameTo('home', 8),
      ...gameTo('home', 12),
      ...gameTo('home', 3)
    ])

    expect(state).toMatchObject({
      current: null,
      periodsWon: { away: 1, home: 3 },
      serveTurn: null,
      serving: null,
      status: 'finished',
      winner: 'home'
    })
  })

  it('[match-log] flags a match point for the side that would win the match', () => {
    const state = stateOf([
      started(),
      ...gameTo('home', 1),
      ...gameTo('home', 1),
      ...rally('hhhhhhhhhh')
    ])

    expect(state.stake).toEqual({ decides: 'match', side: 'home' })
  })

  it('[match-log] flags a game point that does not decide the match', () => {
    const state = stateOf([started(), ...rally('aaaaaaaaaa')])

    expect(state.stake).toEqual({ decides: 'period', side: 'away' })
  })

  it('[match-log] swaps ends after each game', () => {
    expect(stateOf([started(), ...gameTo('home', 2)]).endsSwapped).toBe(true)
  })

  it('[match-log] swaps ends at 5 in the deciding game', () => {
    const toDecider = [
      started(),
      ...gameTo('home', 2),
      ...gameTo('away', 2),
      ...gameTo('home', 2),
      ...gameTo('away', 2)
    ]

    expect([
      stateOf([...toDecider, ...rally('hhhh')]).endsSwapped,
      stateOf([...toDecider, ...rally('hhhhh')]).endsSwapped
    ]).toEqual([false, true])
  })

  it('[match-log] serves from the side named at the start', () => {
    expect(stateOf([started('away')]).serving).toBe('away')
  })

  it('[match-log] undoes the last point', () => {
    const state = stateOf([started(), ...rally('hha'), undo()])

    expect(state.current).toEqual({ away: 0, home: 2 })
  })

  it('[match-log] undoes the point that closed a game, reopening it', () => {
    const state = stateOf([started(), ...gameTo('home', 9), undo()])

    expect(state).toMatchObject({
      current: { away: 9, home: 10 },
      periods: []
    })
  })

  it('[match-log] undoes several points in a row', () => {
    const state = stateOf([started(), ...rally('hhh'), undo(), undo()])

    expect(state.current).toEqual({ away: 0, home: 1 })
  })

  it('[match-log] counts an event resent twice once', () => {
    const scored = point('home')

    expect(stateOf([started(), scored, scored]).current).toEqual({
      away: 0,
      home: 1
    })
  })

  it('[match-log] gives the match to the opponent of a side that retires', () => {
    const state = stateOf([started(), ...rally('hh'), retirement('home')])

    expect(state).toMatchObject({
      concession: { by: 'home', reason: 'retirement' },
      status: 'finished',
      winner: 'away'
    })
  })

  it('[match-log] records a walkover on a match that never started', () => {
    expect(stateOf([walkover()])).toMatchObject({
      current: null,
      status: 'finished',
      winner: 'home'
    })
  })

  it('[match-log] undoes a walkover back to a scheduled match', () => {
    expect(stateOf([walkover(), undo()]).status).toBe('scheduled')
  })

  it('[match-log] lets the organiser rewrite the score mid-match', () => {
    const corrected = correction([
      { away: 11, home: 7 },
      { away: 4, home: 6 }
    ])

    expect(stateOf([started(), ...rally('hhh'), corrected])).toMatchObject({
      current: { away: 4, home: 6 },
      periods: [{ away: 11, home: 7 }]
    })
  })

  it('[match-log] undoes a correction like a point', () => {
    const corrected = correction([{ away: 4, home: 6 }])

    expect(
      stateOf([started(), ...rally('h'), corrected, undo()]).current
    ).toEqual({ away: 0, home: 1 })
  })

  it('[match-log] reports whether there is anything to undo', () => {
    expect([
      stateOf([started()]).canUndo,
      stateOf([started(), point('home')]).canUndo
    ]).toEqual([false, true])
  })
})

describe('recordScoringEvent', () => {
  const record = (log: readonly ScoringEvent[], event: ScoringEvent) =>
    recordScoringEvent({ event, format: BEST_OF_5, log })

  it('[match-log] appends an accepted point', () => {
    const scored = point('away')
    const recorded = record([started()], scored)

    expect(recorded.status === 'success' && recorded.data.at(-1)).toEqual(
      scored
    )
  })

  const won = [
    started(),
    ...gameTo('home', 0),
    ...gameTo('home', 0),
    ...gameTo('home', 0)
  ]
  const alreadyHeld = point('home')

  it.each<[string, readonly ScoringEvent[], ScoringEvent, string]>([
    ['a point before the start', [], point('home'), 'not_started'],
    ['a second start', [started()], started(), 'already_started'],
    ['a point once the match is won', won, point('away'), 'match_over'],
    ['an undo with nothing to undo', [started()], undo(), 'nothing_to_undo'],
    [
      'an event it already holds',
      [started(), alreadyHeld],
      alreadyHeld,
      'duplicate'
    ],
    [
      'to end a table tennis match by hand',
      [started()],
      { id: randomUUID(), type: 'match.ended' },
      'cannot_end'
    ]
  ])('[match-log] refuses %s', (_, log, event, error) => {
    expect(record(log, event)).toEqual({ error, status: 'failure' })
  })

  it('[match-log] still lets the last point of a won match be undone', () => {
    expect(record(won, undo()).status).toBe('success')
  })

  it.each([
    ['a game past 11 without two points in it', [{ away: 3, home: 13 }]],
    [
      'an earlier game left unfinished',
      [
        { away: 5, home: 8 },
        { away: 0, home: 0 }
      ]
    ],
    [
      'a game after the match was won',
      [
        { away: 0, home: 11 },
        { away: 0, home: 11 },
        { away: 0, home: 11 },
        { away: 2, home: 0 }
      ]
    ]
  ])('[match-log] refuses a correction with %s', (_, periods) => {
    expect(record([started()], correction(periods))).toEqual({
      error: 'invalid_score',
      status: 'failure'
    })
  })
})
