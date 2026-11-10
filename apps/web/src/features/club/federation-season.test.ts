import { describe, expect, it } from 'vitest'

import type {
  FederationFixture,
  FederationPool,
  FederationTeam
} from '@scoreboard/protocol/federation'

import {
  type FederationSelf,
  federationScoreOf,
  federationTeamOf,
  fixtureLabelAsName,
  isSelfStanding,
  nextFederationRoundOf,
  selfFixtureOf,
  teamNumberOf
} from './federation-season'

const OURS = '12850078'
const THEIRS = '12850097'

const teamOf = (
  id: string,
  name: string,
  phase: 1 | 2 | null,
  hasPool = true
): FederationTeam => ({
  competition: 'FED_Championnat de France par Equipes Masculin',
  division: 'D85_DÉPARTEMENTALE_1_Ph1 Poule A',
  id,
  name,
  phase,
  pool: hasPool ? { division: '200001', pool: '300001' } : null
})

const fixtureOf = (
  home: string,
  away: string,
  score: readonly [number, number] | null
): FederationFixture => ({
  awayClubNumber: away.startsWith('PPC') ? OURS : THEIRS,
  awayScore: score?.[1] ?? null,
  awayTeam: away,
  encounter: null,
  homeClubNumber: home.startsWith('PPC') ? OURS : THEIRS,
  homeScore: score?.[0] ?? null,
  homeTeam: home
})

const self: FederationSelf = {
  clubNumber: OURS,
  team: teamOf('9001', 'PPC ANGLES 1', 1)
}

const pool: FederationPool = {
  reference: { division: '200001', pool: '300001' },
  rounds: [
    {
      date: '2026-09-19',
      fixtures: [
        fixtureOf('PPC ANGLES (2)', 'LUCON TT (1)', [8, 6]),
        fixtureOf('LUCON TT (2)', 'PPC ANGLES (1)', [5, 9])
      ],
      number: 1
    },
    {
      date: '2026-10-03',
      fixtures: [fixtureOf('PPC ANGLES (1)', 'LUCON TT (1)', null)],
      number: 2
    }
  ],
  standings: []
}

describe('teamNumberOf', () => {
  it('reads the number ending a directory, a club-list or a fixture name', () => {
    expect(teamNumberOf('Angles 2')).toBe(2)
    expect(teamNumberOf('PPC ANGLES 12')).toBe(12)
    expect(teamNumberOf('PPC ANGLES (3)')).toBe(3)
  })

  it('takes a name without a number as the first team', () => {
    expect(teamNumberOf('Angles')).toBe(1)
  })
})

describe('fixtureLabelAsName', () => {
  it('writes a fixture label the way the standings name the team', () => {
    expect(fixtureLabelAsName('LUCON TT (1)')).toBe('LUCON TT 1')
    expect(fixtureLabelAsName('LA PALUE 1')).toBe('LA PALUE 1')
  })
})

describe('federationTeamOf', () => {
  const teams = [
    teamOf('9001', 'PPC ANGLES 1', 1),
    teamOf('9002', 'PPC ANGLES 2', 2),
    teamOf('9003', 'PPC ANGLES 3', 1, false)
  ]

  it('matches our team to the FFTT team of the same number and phase', () => {
    expect(federationTeamOf({ name: 'Angles 1', phase: 1, teams })?.id).toBe(
      '9001'
    )
  })

  it('leaves a team of another phase, or one without a pool, unmatched', () => {
    expect(federationTeamOf({ name: 'Angles 2', phase: 1, teams })).toBeNull()
    expect(federationTeamOf({ name: 'Angles 3', phase: 1, teams })).toBeNull()
  })
})

describe('selfFixtureOf', () => {
  it('finds our encounter by club number and team number, on its side', () => {
    const round = pool.rounds[0]

    expect(round && selfFixtureOf(self, round)?.side).toBe('away')
    expect(round && selfFixtureOf(self, round)?.fixture.homeTeam).toBe(
      'LUCON TT (2)'
    )
  })

  it('rests on a round without our team', () => {
    expect(
      selfFixtureOf(self, {
        date: null,
        fixtures: [fixtureOf('PPC ANGLES (2)', 'LUCON TT (1)', null)],
        number: 3
      })
    ).toBeNull()
  })
})

describe('federationScoreOf', () => {
  it('turns the score to our side, and waits for both scores', () => {
    expect(
      federationScoreOf(
        fixtureOf('LUCON TT (2)', 'PPC ANGLES (1)', [5, 9]),
        'away'
      )
    ).toEqual({ ours: 9, theirs: 5 })
    expect(
      federationScoreOf(
        fixtureOf('PPC ANGLES (1)', 'LUCON TT (1)', null),
        'home'
      )
    ).toBeNull()
  })
})

describe('nextFederationRoundOf', () => {
  it('is the first round of ours the FFTT has no score for', () => {
    expect(nextFederationRoundOf(self, pool)?.number).toBe(2)
  })
})

describe('isSelfStanding', () => {
  it('prefers the FFTT team id, else the club number and team number', () => {
    const row = {
      clubNumber: OURS,
      gamesLost: null,
      gamesWon: null,
      played: 1,
      points: 3,
      rank: 1,
      team: 'PPC ANGLES 1',
      teamId: null
    }

    expect(isSelfStanding(self, row)).toBe(true)
    expect(isSelfStanding(self, { ...row, teamId: '9002' })).toBe(false)
    expect(isSelfStanding(self, { ...row, team: 'PPC ANGLES 2' })).toBe(false)
  })
})
