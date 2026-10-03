import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { TableTennisFormat } from '@scoreboard/protocol/match-format'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'
import type { Score, Side } from '@scoreboard/protocol/side'

import { describeMatch, recordScoringEvent } from './match-log'

const BEST_OF_5: TableTennisFormat = {
  bestOf: 5,
  pointsPerGame: 11,
  sport: 'table-tennis'
}

const started = (firstServer: Side = 'home'): ScoringEvent => ({
  firstServer,
  id: randomUUID(),
  type: 'match.started'
})

const point = (side: Side): ScoringEvent => ({
  id: randomUUID(),
  side,
  type: 'point.scored'
})

const undo = (): ScoringEvent => ({ id: randomUUID(), type: 'score.undone' })

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
    const state = stateOf([
      started(),
      ...rally('hh'),
      {
        by: 'home',
        id: randomUUID(),
        reason: 'retirement',
        type: 'match.conceded'
      }
    ])

    expect(state).toMatchObject({
      concession: { by: 'home', reason: 'retirement' },
      status: 'finished',
      winner: 'away'
    })
  })

  it('[match-log] lets the organiser rewrite the score mid-match', () => {
    const corrected: ScoringEvent = {
      id: randomUUID(),
      periods: [
        { away: 11, home: 7 },
        { away: 4, home: 6 }
      ],
      type: 'score.corrected'
    }

    expect(stateOf([started(), ...rally('hhh'), corrected])).toMatchObject({
      current: { away: 4, home: 6 },
      periods: [{ away: 11, home: 7 }]
    })
  })

  it('[match-log] undoes a correction like a point', () => {
    const corrected: ScoringEvent = {
      id: randomUUID(),
      periods: [{ away: 4, home: 6 }],
      type: 'score.corrected'
    }

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

  it('[match-log] refuses a point before the start', () => {
    expect(record([], point('home'))).toEqual({
      error: 'not_started',
      status: 'failure'
    })
  })

  it('[match-log] refuses a second start', () => {
    expect(record([started()], started())).toEqual({
      error: 'already_started',
      status: 'failure'
    })
  })

  it('[match-log] refuses a point once the match is won', () => {
    const won = [
      started(),
      ...gameTo('home', 0),
      ...gameTo('home', 0),
      ...gameTo('home', 0)
    ]

    expect(record(won, point('away'))).toEqual({
      error: 'match_over',
      status: 'failure'
    })
  })

  it('[match-log] still lets the last point of a won match be undone', () => {
    const won = [
      started(),
      ...gameTo('home', 0),
      ...gameTo('home', 0),
      ...gameTo('home', 0)
    ]

    expect(record(won, undo()).status).toBe('success')
  })

  it('[match-log] refuses an undo with nothing to undo', () => {
    expect(record([started()], undo())).toEqual({
      error: 'nothing_to_undo',
      status: 'failure'
    })
  })

  it('[match-log] reports an event it already holds as a duplicate', () => {
    const scored = point('home')

    expect(record([started(), scored], scored)).toEqual({
      error: 'duplicate',
      status: 'failure'
    })
  })

  it('[match-log] refuses to end a table tennis match by hand', () => {
    expect(
      record([started()], { id: randomUUID(), type: 'match.ended' })
    ).toEqual({
      error: 'cannot_end',
      status: 'failure'
    })
  })

  const correction = (periods: Score[]): ScoringEvent => ({
    id: randomUUID(),
    periods,
    type: 'score.corrected'
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
