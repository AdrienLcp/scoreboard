import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { ChampionshipPool } from '@scoreboard/protocol/championship'
import type {
  ClubRecord,
  DirectoryTeam
} from '@scoreboard/protocol/club-record'
import type { TeamId } from '@scoreboard/protocol/identifiers'

import { poolRoundsFor } from '@scoreboard/core/championship/championship-calendar'

import { leadingStandingOf } from './club-standing'

const teamNamed = (name: string): DirectoryTeam => ({
  colour: '#8FCBEF',
  division: 'D2',
  formatId: 'fftt-6-players-20-games',
  id: randomUUID(),
  lineup: [],
  matchPoints: 'one-per-win',
  name,
  tables: []
})

const angles1 = teamNamed('Angles 1')
const angles2 = teamNamed('Angles 2')

/** Round 1 of eight is 1–8, 2–7, 3–6, 4–5: our team holds number 1, and loses its first round when `isPlayed`. */
const poolOf = (teamId: TeamId, isPlayed: boolean): ChampionshipPool => {
  const rounds = poolRoundsFor(8)

  return {
    division: 'D2',
    id: randomUUID(),
    number: 1,
    phase: 1,
    points: { draw: 2, forfeit: 0, loss: 1, win: 3 },
    rounds: rounds.map((round, index) =>
      index === 0 && isPlayed
        ? {
            ...round,
            fixtures: round.fixtures.map((fixture) => ({
              ...fixture,
              result: { forfeit: null, score: { away: 12, home: 8 } }
            }))
          }
        : round
    ),
    season: 2026,
    teams: Array.from({ length: 8 }, (_, index) =>
      index === 0 ? teamId : null
    )
  }
}

const recordWith = (pools: ChampionshipPool[]): ClubRecord => ({
  defaultPlanId: null,
  opponentColour: '#FFFFFF',
  opponents: [],
  own: {
    id: randomUUID(),
    logoUrl: null,
    name: 'Angles',
    number: null,
    players: [],
    teams: [angles1, angles2]
  },
  plans: [],
  pools
})

describe('the club standing on home', () => {
  it('names our first team whose pool has a result, with its rank there', () => {
    const standing = leadingStandingOf(
      recordWith([poolOf(angles1.id, false), poolOf(angles2.id, true)])
    )

    expect(standing?.team.name).toBe('Angles 2')
    expect(standing?.phase).toBe(1)
    expect(standing?.rank).toBeGreaterThan(1)
  })

  it('names nobody before the first result', () => {
    expect(
      leadingStandingOf(
        recordWith([poolOf(angles1.id, false), poolOf(angles2.id, false)])
      )
    ).toBeNull()
  })
})
