import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'
import type { Side } from '@scoreboard/protocol/side'
import { BEST_OF_5 } from '@scoreboard/protocol/testing/match-formats'
import {
  card,
  cardWithdrawn,
  confirmed,
  correction,
  point,
  retirement,
  started,
  timeout,
  timeoutWithdrawn,
  undo,
  walkover
} from '@scoreboard/protocol/testing/scoring-events'

import { describeMatch, recordScoringEvent } from './match-log'

/** `'hha'` is two points for home then one for away. */
const rally = (sequence: string): ScoringEvent[] =>
  [...sequence].map((letter) => point(letter === 'h' ? 'home' : 'away'))

/** The points of a game won to `loserScore`, the winner scoring last, not yet confirmed by the umpire. */
const pointsTo = (winner: Side, loserScore: number): ScoringEvent[] => {
  const loser = winner === 'home' ? 'a' : 'h'
  const win = winner === 'home' ? 'h' : 'a'
  const isPastDeuce = loserScore >= 10

  return rally(
    isPastDeuce
      ? `${loser}${win}`.repeat(loserScore) + win.repeat(2)
      : loser.repeat(loserScore) + win.repeat(11)
  )
}

/** A game won to `loserScore` and confirmed by the umpire. */
const gameTo = (winner: Side, loserScore: number): ScoringEvent[] => [
  ...pointsTo(winner, loserScore),
  confirmed()
]

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

  it('[match-log] keeps a game won at 11-9 on screen until the umpire confirms it', () => {
    const state = stateOf([started(), ...pointsTo('home', 9)])

    expect(state).toMatchObject({
      awaiting: { decides: 'period', side: 'home' },
      current: { away: 9, home: 11 },
      periods: [],
      periodsWon: { away: 0, home: 0 },
      serving: null,
      stake: null,
      status: 'live'
    })
  })

  it('[match-log] opens the next game at 0-0 once the umpire confirms the won one', () => {
    const state = stateOf([started(), ...gameTo('home', 9)])

    expect(state).toMatchObject({
      awaiting: null,
      current: { away: 0, home: 0 },
      periods: [{ away: 9, home: 11 }],
      periodsWon: { away: 0, home: 1 }
    })
  })

  it('[match-log] keeps a won match live until the umpire confirms its last game', () => {
    const toMatchPoint = [
      started(),
      ...gameTo('home', 1),
      ...gameTo('home', 1),
      ...pointsTo('home', 1)
    ]

    expect([
      stateOf(toMatchPoint),
      stateOf([...toMatchPoint, confirmed()])
    ]).toMatchObject([
      {
        awaiting: { decides: 'match', side: 'home' },
        status: 'live',
        winner: null
      },
      { awaiting: null, status: 'finished', winner: 'home' }
    ])
  })

  it('[match-log] plays a long deuce through to 16-14', () => {
    const state = stateOf([started(), ...pointsTo('away', 14)])

    expect(state).toMatchObject({
      awaiting: { decides: 'period', side: 'away' },
      current: { away: 16, home: 14 }
    })
  })

  it('[match-log] undoes a confirmation back to the won game, still waiting', () => {
    const state = stateOf([started(), ...gameTo('home', 9), undo()])

    expect(state).toMatchObject({
      awaiting: { decides: 'period', side: 'home' },
      current: { away: 9, home: 11 },
      periods: []
    })
  })

  it('[match-log] reopens only the won game, never the one before, when undone twice', () => {
    const state = stateOf([
      started(),
      ...gameTo('away', 4),
      ...gameTo('home', 9),
      undo(),
      undo()
    ])

    expect(state).toMatchObject({
      awaiting: null,
      current: { away: 9, home: 10 },
      periods: [{ away: 11, home: 4 }]
    })
  })

  it('[match-log] gives a forfeit every game it takes to win, each to love', () => {
    expect(stateOf([walkover('away')])).toMatchObject({
      current: null,
      periods: [
        { away: 0, home: 11 },
        { away: 0, home: 11 },
        { away: 0, home: 11 }
      ],
      periodsWon: { away: 0, home: 3 },
      winner: 'home'
    })
  })

  it('[match-log] records one time-out per side', () => {
    const state = stateOf([started(), ...rally('hh'), timeout('away')])

    expect(state.timeouts).toEqual({ away: true, home: false })
  })

  it('[match-log] takes back a time-out with undo or by withdrawing it later', () => {
    const called = [started(), timeout('home')]
    const withdrawnLater = stateOf([
      ...called,
      ...rally('aa'),
      timeoutWithdrawn('home')
    ])

    expect([
      stateOf([...called, undo()]).timeouts.home,
      withdrawnLater.timeouts.home,
      withdrawnLater.current
    ]).toEqual([false, false, { away: 2, home: 0 }])
  })

  it('[match-log] shows a yellow card without touching the score', () => {
    const yellow = card({ side: 'home' })
    const state = stateOf([started(), ...rally('a'), yellow])

    expect(state).toMatchObject({
      cards: [{ id: yellow.id, penalty: 0, playerId: null, side: 'home' }],
      current: { away: 1, home: 0 }
    })
  })

  it('[match-log] gives the opponent the penalty points of a yellow and red card', () => {
    const state = stateOf([started(), card({ penalty: 2, side: 'away' })])

    expect(state.current).toEqual({ away: 0, home: 2 })
  })

  it('[match-log] stops the penalty at the point that wins the game', () => {
    const state = stateOf([
      started(),
      ...rally('hhhhhhhhhh'),
      card({ penalty: 2, side: 'away' })
    ])

    expect(state).toMatchObject({
      awaiting: { decides: 'period', side: 'home' },
      current: { away: 0, home: 11 }
    })
  })

  it('[match-log] undoes a penalty card and its points in one step', () => {
    const state = stateOf([
      started(),
      card({ penalty: 1, side: 'away' }),
      undo()
    ])

    expect(state).toMatchObject({ cards: [], current: { away: 0, home: 0 } })
  })

  it('[match-log] withdraws a card later, leaving the score', () => {
    const yellowRed = card({ penalty: 1, side: 'away' })
    const state = stateOf([
      started(),
      yellowRed,
      ...rally('a'),
      cardWithdrawn(yellowRed.id)
    ])

    expect(state).toMatchObject({ cards: [], current: { away: 1, home: 1 } })
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

  it('[match-log] undoes the point that won a game, reopening it', () => {
    const state = stateOf([started(), ...pointsTo('home', 9), undo()])

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

  it('[match-log] counts a corrected game as confirmed, with nothing left to validate', () => {
    const state = stateOf([
      started(),
      ...pointsTo('home', 7),
      correction([{ away: 7, home: 11 }])
    ])

    expect(state).toMatchObject({
      awaiting: null,
      current: { away: 0, home: 0 },
      periodsWon: { away: 0, home: 1 }
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
    [
      'a point in a won game the umpire has not confirmed',
      [started(), ...pointsTo('home', 3)],
      point('away'),
      'awaiting_confirmation'
    ],
    [
      'a confirmation with no won game',
      [started(), ...rally('hh')],
      confirmed(),
      'nothing_to_confirm'
    ],
    [
      'a second time-out for the same side',
      [started(), timeout('home'), ...rally('a')],
      timeout('home'),
      'timeout_already_taken'
    ],
    ['a time-out once the match is won', won, timeout('away'), 'match_over'],
    [
      'withdrawing a time-out never called',
      [started()],
      timeoutWithdrawn('away'),
      'no_timeout_to_withdraw'
    ],
    [
      'withdrawing a card never shown',
      [started()],
      cardWithdrawn(randomUUID()),
      'card_not_found'
    ],
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
