import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { clubRecordSchema } from '@scoreboard/protocol/club-record'
import { setupWith } from '@scoreboard/protocol/testing/event-setups'

import { dayRoundOf } from './round-of-day'

const DAY = '2026-11-08'

const teamNamed = (name: string) => ({
  colour: '#FFFFFF',
  division: null,
  formatId: 'fftt-6-players-20-games',
  id: randomUUID(),
  lineup: [],
  name,
  tables: []
})

const clubWith = (name: string, teams: ReturnType<typeof teamNamed>[]) => ({
  id: randomUUID(),
  name,
  number: null,
  players: [],
  teams
})

const angles1 = teamNamed('Angles 1')
const angles3 = teamNamed('Angles 3')
const riverside2 = teamNamed('Riverside 2')
const westfield1 = teamNamed('Westfield 1')

const poolOf = (teams: string[]) => ({
  division: null,
  id: randomUUID(),
  number: null,
  phase: 1,
  rounds: [
    { date: '2026-10-25', fixtures: [] },
    {
      date: DAY,
      fixtures: [{ away: 2, home: 1, playedAs: null, result: null }]
    }
  ],
  season: 2026,
  teams: [...teams, null, null]
})

const record = clubRecordSchema.parse({
  opponentColour: '#FFFFFF',
  opponents: [
    clubWith('Riverside', [riverside2]),
    clubWith('Westfield', [westfield1])
  ],
  own: clubWith('Angles', [angles1, angles3]),
  pools: [
    poolOf([angles1.id, riverside2.id]),
    poolOf([westfield1.id, angles3.id])
  ]
})

describe('dayRoundOf', () => {
  it('[organiser] names the round, the encounters played away and whether one at home is missing', () => {
    expect(
      dayRoundOf({
        day: DAY,
        eventId: 'k3m8p2r7t9',
        record,
        setup: setupWith([])
      })
    ).toEqual({
      away: [{ at: 'Westfield', team: 'Angles 3' }],
      hasHomeToAdd: true,
      number: 2
    })
  })
})
