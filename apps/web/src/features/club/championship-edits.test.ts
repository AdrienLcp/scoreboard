import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { ChampionshipPool } from '@scoreboard/protocol/championship'
import type {
  ClubRecord,
  DirectoryTeam
} from '@scoreboard/protocol/club-record'

import {
  addPool,
  currentPoolsOf,
  datedRound,
  pickedResult,
  playedFixture,
  seatPoolTeam,
  withEventSheets
} from './championship-edits'

const teamNamed = (name: string): DirectoryTeam => ({
  colour: '#8FCBEF',
  division: 'D2',
  formatId: 'fftt-6-players-20-games',
  id: randomUUID(),
  lineup: [],
  matchPoints: 'one-per-win',
  name,
  tables: [1, 2]
})

const angles1 = teamNamed('Angles 1')
const riviere2 = teamNamed('Rivière 2')

const record: ClubRecord = {
  hall: null,
  opponentColour: '#FFFFFF',
  opponents: [
    {
      id: randomUUID(),
      logoUrl: null,
      name: 'Rivière',
      number: null,
      players: [],
      teams: [riviere2]
    }
  ],
  own: {
    id: randomUUID(),
    logoUrl: null,
    name: 'Angles',
    number: null,
    players: [],
    teams: [angles1]
  },
  pools: []
}

const withPool = (today: string): ClubRecord =>
  addPool({ newPoolId: randomUUID, record, teamId: angles1.id, today })

const onlyPool = (current: ClubRecord): ChampionshipPool => {
  const pool = current.pools[0]

  if (pool === undefined) {
    throw new Error('no pool')
  }

  return pool
}

describe('championship edits', () => {
  it('opens a pool of eight for our team, its phase from the day, then the next phase', () => {
    const autumn = withPool('2026-09-02')
    const pool = onlyPool(autumn)

    expect(pool).toMatchObject({ division: 'D2', phase: 1, season: 2026 })
    expect(pool.teams).toHaveLength(8)
    expect(pool.teams[0]).toBe(angles1.id)
    expect(pool.rounds).toHaveLength(7)
    expect(onlyPool(withPool('2026-12-20')).phase).toBe(2)
    expect(onlyPool(withPool('2027-02-01'))).toMatchObject({
      phase: 2,
      season: 2026
    })

    const next = addPool({
      newPoolId: randomUUID,
      record: autumn,
      teamId: angles1.id,
      today: '2026-09-02'
    })

    expect(currentPoolsOf(next)).toHaveLength(1)
    expect(currentPoolsOf(next)[0]).toMatchObject({ phase: 2, season: 2026 })
  })

  it('moves a team to another number, leaving its old one empty', () => {
    const pool = seatPoolTeam({
      number: 4,
      pool: onlyPool(withPool('2026-09-02')),
      teamId: angles1.id
    })

    expect(pool.teams[0]).toBeNull()
    expect(pool.teams[3]).toBe(angles1.id)
  })

  it('places the undated rounds after a date two weeks apart, never moving a dated one', () => {
    const pool = datedRound({
      date: '2026-10-18',
      pool: datedRound({
        date: '2026-09-27',
        pool: onlyPool(withPool('2026-09-02')),
        roundIndex: 0
      }),
      roundIndex: 2
    })

    expect(pool.rounds.map((round) => round.date)).toEqual([
      '2026-09-27',
      '2026-10-11',
      '2026-10-18',
      '2026-11-08',
      '2026-11-22',
      '2026-12-06',
      '2026-12-20'
    ])
  })

  it('follows the sheet of the encounter created for a fixture until a result is picked', () => {
    const eventId = 'event-1'
    const encounterId = randomUUID()
    const seated = seatPoolTeam({
      number: 8,
      pool: onlyPool(withPool('2026-09-02')),
      teamId: riviere2.id
    })
    const linked = playedFixture({
      at: { fixtureIndex: 0, roundIndex: 0 },
      playedAs: { encounterId, eventId },
      poolId: seated.id,
      record: { ...record, pools: [seated] }
    })
    const sheet = {
      encounters: [
        {
          away: riviere2.id,
          formatId: 'fftt-6-players-20-games' as const,
          home: angles1.id,
          id: encounterId,
          matchPoints: 'one-per-win' as const
        }
      ],
      eventId,
      views: [
        {
          id: encounterId,
          outcome: 'home' as const,
          points: { away: 9, home: 11 }
        }
      ]
    }
    const written = withEventSheets({ ...sheet, record: linked })
    const fixture = onlyPool(written).rounds[0]?.fixtures[0]

    expect(fixture?.result).toEqual({
      forfeit: null,
      score: { away: 9, home: 11 }
    })
    expect(withEventSheets({ ...sheet, record: written })).toBe(written)

    const picked = pickedResult({
      at: { fixtureIndex: 0, roundIndex: 0 },
      pool: onlyPool(written),
      result: { forfeit: null, score: { away: 10, home: 10 } }
    })

    expect(picked.rounds[0]?.fixtures[0]?.playedAs).toBeNull()
  })
})
