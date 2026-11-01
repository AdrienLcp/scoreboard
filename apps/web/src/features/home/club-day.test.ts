import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { ChampionshipPool } from '@scoreboard/protocol/championship'
import type {
  ClubRecord,
  DirectoryClub,
  DirectoryTeam
} from '@scoreboard/protocol/club-record'
import type { TeamId } from '@scoreboard/protocol/identifiers'

import { poolRoundsFor } from '@scoreboard/core/championship/championship-calendar'

import { withPlayedEntries } from '@/features/club/round-entries'

import {
  type ClubRound,
  clubRoundOf,
  eventInputFor,
  roundEventInput,
  roundEventOf,
  roundProgressIn
} from './club-day'

const teamNamed = (
  name: string,
  tables: DirectoryTeam['tables'] = []
): DirectoryTeam => ({
  colour: '#8FCBEF',
  division: 'D2',
  formatId: 'fftt-6-players-20-games',
  id: randomUUID(),
  lineup: [],
  matchPoints: 'one-per-win',
  name,
  tables
})

const clubOf = (name: string, teams: DirectoryTeam[]): DirectoryClub => ({
  id: randomUUID(),
  logoUrl: null,
  name,
  number: null,
  players: [],
  teams
})

const angles1 = teamNamed('Angles 1', [1, 2])
const angles2 = teamNamed('Angles 2', [3, 4])
const angles3 = teamNamed('Angles 3')
const riviere2 = teamNamed('Rivière 2')
const north4 = teamNamed('North 4')
const east1 = teamNamed('East 1')

/** Berger's grid for eight: round 1 is 1–8, 2–7, 3–6, 4–5; round 2 is 8–5, 6–4, 7–3, 1–2. */
const poolOf = (seats: Record<number, TeamId>): ChampionshipPool => ({
  division: 'D2',
  id: randomUUID(),
  number: 1,
  phase: 1,
  points: { draw: 2, forfeit: 0, loss: 1, win: 3 },
  rounds: poolRoundsFor(8).map((round, index) => ({
    ...round,
    date: ['2026-11-08', '2026-11-22'][index] ?? null
  })),
  season: 2026,
  teams: Array.from({ length: 8 }, (_, index) => seats[index + 1] ?? null)
})

const hall = {
  depth: 20,
  tables: [1, 2, 3, 4, 5, 6].map((table) => ({
    isHidden: table === 6,
    isTurned: false,
    table,
    x: table * 3,
    y: 2
  })),
  width: 37
}

const record: ClubRecord = {
  defaultPlanId: 'hall',
  opponentColour: '#FFFFFF',
  opponents: [
    clubOf('Rivière', [riviere2]),
    clubOf('North', [north4]),
    clubOf('East', [east1])
  ],
  own: clubOf('Angles', [angles1, angles2, angles3]),
  plans: [{ id: 'hall', name: 'Salle à 6 tables', plan: hall }],
  pools: [
    poolOf({ 1: angles1.id, 2: angles2.id, 7: north4.id, 8: riviere2.id }),
    poolOf({ 1: east1.id, 8: angles3.id })
  ]
}

const roundOn = (current: ClubRecord, day: string): ClubRound => {
  const round = clubRoundOf(current, day)

  if (round === null) {
    throw new Error(`no round on ${day}`)
  }

  return round
}

const sequence = (prefix: string) => {
  let next = 0

  return () =>
    `${prefix}-${String(next++).padStart(4, '0')}-4000-8000-000000000000`
}

describe('the club round on home', () => {
  it('leads with the round to come: our home encounters, then the away ones', () => {
    const round = roundOn(record, '2026-11-01')

    expect(round).toMatchObject({ date: '2026-11-08', number: 1, phase: 1 })
    expect(round.home.map((entry) => entry.home?.team.name)).toEqual([
      'Angles 1',
      'Angles 2'
    ])
    expect(round.home.map((entry) => entry.away?.team.name)).toEqual([
      'Rivière 2',
      'North 4'
    ])
    expect(round.away.map((entry) => entry.home?.team.name)).toEqual(['East 1'])
  })

  it('keeps the round of the day, then moves to the next one', () => {
    expect(roundOn(record, '2026-11-08').number).toBe(1)
    expect(roundOn(record, '2026-11-09')).toMatchObject({
      date: '2026-11-22',
      number: 2
    })
  })

  it('opens the day with the default plan and each home encounter on its tables', () => {
    const round = roundOn(record, '2026-11-01')
    const { input, placed } = roundEventInput({
      name: 'Round 1',
      newEncounterId: sequence('aaaaaaaa'),
      newMatchId: sequence('bbbbbbbb'),
      record,
      round
    })

    expect(input).toMatchObject({
      club: { name: 'Angles' },
      hall,
      name: 'Round 1',
      tableCount: 6
    })
    expect(
      input.programme?.encounters.map((encounter) => encounter.home)
    ).toEqual([angles1.id, angles2.id])
    expect(input.programme?.teams).toHaveLength(4)
    expect(input.programme?.matches.length).toBeGreaterThan(0)
    expect(placed.map((entry) => entry.tables)).toEqual([
      [1, 2],
      [3, 4]
    ])
  })

  it('offers to pick the round up again once this device prepared it, until its results stand', () => {
    const round = roundOn(record, '2026-11-01')
    const { placed } = roundEventInput({
      name: 'Round 1',
      newEncounterId: sequence('cccccccc'),
      newMatchId: sequence('dddddddd'),
      record,
      round
    })
    const prepared = withPlayedEntries({
      eventId: 'abcdefghij',
      placed,
      record
    })
    const preparedRound = roundOn(prepared, '2026-11-01')

    expect(preparedRound.number).toBe(1)
    expect(roundEventOf(preparedRound, ['zzzzzzzzzz', 'abcdefghij'])).toBe(
      'abcdefghij'
    )
    expect(roundEventOf(preparedRound, ['zzzzzzzzzz'])).toBeNull()
    expect(roundProgressIn(preparedRound, 'abcdefghij')).toEqual({
      finished: 0,
      total: 2
    })
  })

  it('opens a new event without a club on eight tables, three games to win', () => {
    expect(eventInputFor({ name: 'Tournament', record: null })).toEqual({
      club: null,
      format: { bestOf: 5, pointsPerGame: 11, sport: 'table-tennis' },
      hall: null,
      name: 'Tournament',
      tableCount: 8
    })
  })
})
