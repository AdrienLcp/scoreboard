import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { clubRecordSchema } from '@scoreboard/protocol/club-record'
import { setupWith } from '@scoreboard/protocol/testing/event-setups'

import { isPlayedAtHome, placeEntries, roundEntriesOf } from './round-entries'

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
const angles2 = teamNamed('Angles 2')
const angles3 = teamNamed('Angles 3')
const angles4 = teamNamed('Angles 4')
const riverside2 = teamNamed('Riverside 2')
const westfield1 = teamNamed('Westfield 1')

/** A pool whose round of the day has team 1 receive team 2. */
const poolOf = (home: string, away: string) => ({
  division: null,
  id: randomUUID(),
  number: null,
  phase: 1,
  rounds: [
    {
      date: DAY,
      fixtures: [{ away: 2, home: 1, playedAs: null, result: null }]
    }
  ],
  season: 2026,
  teams: [home, away, null, null]
})

const record = clubRecordSchema.parse({
  opponentColour: '#FFFFFF',
  opponents: [
    clubWith('Riverside', [riverside2]),
    clubWith('Westfield', [westfield1])
  ],
  own: clubWith('Angles', [angles1, angles2, angles3, angles4]),
  pools: [
    poolOf(angles1.id, riverside2.id),
    poolOf(westfield1.id, angles3.id),
    poolOf(angles2.id, angles4.id)
  ]
})

const entries = roundEntriesOf(record, DAY)

describe('round entries', () => {
  it('[club] plays at home what one of our teams receives, another of ours included', () => {
    expect(
      entries.map((entry) => [entry.home?.team.name, isPlayedAtHome(entry)])
    ).toEqual([
      ['Angles 1', true],
      ['Westfield 1', false],
      ['Angles 2', true]
    ])
  })

  it('[club] never brings into the day an encounter received in another club’s hall', () => {
    const { placed, setup } = placeEntries({
      entries,
      newEncounterId: randomUUID,
      newMatchId: randomUUID,
      setup: setupWith([], { tableCount: 8 })
    })

    expect(placed.map(({ entry }) => entry.home?.team.name)).toEqual([
      'Angles 1',
      'Angles 2'
    ])
    expect(setup.encounters.map((encounter) => encounter.away)).toEqual([
      riverside2.id,
      angles4.id
    ])
  })
})
