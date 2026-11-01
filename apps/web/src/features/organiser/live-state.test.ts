import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { MatchSetup, Team } from '@scoreboard/protocol/event-setup'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'
import type { Side } from '@scoreboard/protocol/side'
import { matchOn, setupWith } from '@scoreboard/protocol/testing/event-setups'
import {
  point,
  stampedAt,
  started
} from '@scoreboard/protocol/testing/scoring-events'

import { publicSnapshotFor } from '@scoreboard/core/event/public-snapshot'
import {
  defaultHallPlan,
  standingPairsOf
} from '@scoreboard/core/hall/hall-plan'

import {
  hasPlayBegun,
  liveTableStateOf,
  matchesWithoutTableOf
} from './live-state'
import { blockLabelsOf } from './plan-blocks'
import { tablesAlongTopOf } from './plan-geometry'

const points = (home: number, away: number): ScoringEvent[] => [
  started(),
  ...Array.from({ length: Math.min(home, away) }, () => [
    point('home'),
    point('away')
  ]).flat(),
  ...Array.from({ length: home - Math.min(home, away) }, () => point('home')),
  ...Array.from({ length: away - Math.min(home, away) }, () => point('away'))
]

const dayOf = (
  matches: MatchSetup[],
  scores: ReadonlyMap<string, readonly ScoringEvent[]> = new Map(),
  overrides: Parameters<typeof setupWith>[1] = {}
) =>
  publicSnapshotFor({
    logs: new Map(
      [...scores].map(([id, events]) => [
        id,
        events.map((event, index) => stampedAt(index + 1, event))
      ])
    ),
    nowMs: 1000,
    setup: setupWith(matches, { tableCount: 8, ...overrides })
  })

describe('live tables', () => {
  it('[organiser] tells a free table, the match it waits for and the match on it', () => {
    const waiting = matchOn(2)
    const playing = matchOn(3)
    const day = dayOf([waiting, playing], new Map([[playing.id, points(4, 2)]]))

    expect(liveTableStateOf(day, 1)).toEqual({ kind: 'free' })
    expect(liveTableStateOf(day, 2)).toMatchObject({
      kind: 'next',
      match: { id: waiting.id }
    })
    expect(liveTableStateOf(day, 3)).toMatchObject({
      dimmed: null,
      kind: 'live',
      match: { id: playing.id },
      pill: null
    })
  })

  it('[organiser] dims the loser of a game awaiting validation and says it is won', () => {
    const playing = matchOn(1)
    const day = dayOf([playing], new Map([[playing.id, points(11, 5)]]))

    expect(liveTableStateOf(day, 1)).toMatchObject({
      dimmed: 'away' satisfies Side,
      kind: 'live',
      pill: 'game-won'
    })
  })

  it('[organiser] calls a level score at the end of a game', () => {
    const playing = matchOn(1)
    const day = dayOf([playing], new Map([[playing.id, points(10, 10)]]))

    expect(liveTableStateOf(day, 1)).toMatchObject({ pill: 'deuce' })
  })

  it('[organiser] waits for the first point before calling the day begun', () => {
    const first = matchOn(1)

    expect(hasPlayBegun(dayOf([first]))).toBe(false)
    expect(
      hasPlayBegun(dayOf([first], new Map([[first.id, [started()]]])))
    ).toBe(true)
  })

  it('[organiser] lists the matches not over that no table holds', () => {
    const unseated = matchOn(null)
    const seated = matchOn(1)

    expect(
      matchesWithoutTableOf(dayOf([unseated, seated])).map((match) => match.id)
    ).toEqual([unseated.id])
  })
})

describe('plan blocks', () => {
  it('[organiser] names each block by the encounter on its tables, in the home team’s colour', () => {
    const team = (name: string, colour: string | null): Team => ({
      colour,
      id: randomUUID(),
      name
    })
    const teams = [
      team('Angles 2', '#F4A259'),
      team('Hillside 4', null),
      team('Lakeside 2', '#FFFFFF')
    ]
    const [angles, hillside, lakeside] = teams
    const encounter = (home: Team | undefined, away: Team | undefined) => ({
      away: away?.id ?? '',
      formatId: 'fftt-4-players-14-games' as const,
      home: home?.id ?? '',
      id: randomUUID(),
      matchPoints: 'one-per-win' as const
    })
    const ours = encounter(angles, hillside)
    const theirs = encounter(lakeside, hillside)
    const day = dayOf(
      [
        matchOn(1, { encounterId: ours.id }),
        matchOn(2, { encounterId: ours.id }),
        matchOn(4, { encounterId: theirs.id })
      ],
      new Map(),
      { encounters: [ours, theirs], teams }
    )

    expect(blockLabelsOf({ event: day, tableCount: 7 })).toEqual(
      new Map([
        [
          1,
          {
            colour: { background: '#F4A259', text: '#0E2238' },
            encounter: 'Angles 2 – Hillside 4'
          }
        ],
        [3, { colour: null, encounter: 'Lakeside 2 – Hillside 4' }],
        [5, { colour: null, encounter: null }],
        [7, { colour: null, encounter: null }]
      ])
    )
  })
})

describe('plan geometry', () => {
  it('[organiser] finds the tables standing under a block’s band, along its top', () => {
    const plan = defaultHallPlan(8)
    const along = standingPairsOf(plan).map((pair) =>
      tablesAlongTopOf(pair, plan)
    )

    expect(along).toEqual([[1], [3, 4], [5, 6], [7, 8]])
  })
})
