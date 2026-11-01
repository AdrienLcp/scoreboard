import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import {
  type ClubRecord,
  clubRecordSchema,
  type DirectoryClub,
  type DirectoryTeam
} from '@scoreboard/protocol/club-record'

import { defaultHallPlan } from '@scoreboard/core/hall/hall-plan'

import { changeClubLogo, keepHallPlan, keepLineup } from './club-edits'

const teamOf = (name: string): DirectoryTeam => ({
  colour: '#8FCBEF',
  division: null,
  formatId: 'fftt-6-players-20-games',
  id: randomUUID(),
  lineup: [randomUUID(), randomUUID()],
  matchPoints: 'one-per-win',
  name,
  tables: [1, 2]
})

const clubOf = (name: string, teams: DirectoryTeam[]): DirectoryClub => ({
  id: randomUUID(),
  logoUrl: null,
  name,
  number: null,
  players: [],
  teams
})

const recordWith = (
  own: DirectoryClub,
  opponent: DirectoryClub
): ClubRecord => ({
  hall: null,
  opponentColour: '#FFFFFF',
  opponents: [opponent],
  own
})

describe('club record edits', () => {
  const angles = teamOf('Angles 1')
  const rivals = teamOf('Rivals 2')
  const record = recordWith(
    clubOf('PPC Angles', [angles]),
    clubOf('Rivals', [rivals])
  )

  it('[club] keeps the day composition as the team last one, on our side or theirs', () => {
    const lineup = [randomUUID(), null, randomUUID()]
    const kept = keepLineup({
      lineup: [...lineup].reverse(),
      record: keepLineup({ lineup, record, teamId: angles.id }),
      teamId: rivals.id
    })

    expect(kept.own.teams[0]?.lineup).toEqual(lineup)
    expect(kept.opponents[0]?.teams[0]?.lineup).toEqual([...lineup].reverse())
  })

  it('[club] keeps an event plan for the club with every table back in play', () => {
    const plan = defaultHallPlan(8)
    const putAway = {
      tables: plan.tables.map((table) =>
        table.table === 3 ? { ...table, isHidden: true } : table
      )
    }

    expect(keepHallPlan(record, putAway).hall).toEqual(plan)
  })

  it('[club] sets and removes a club logo without touching the others', () => {
    const logoUrl = '/api/logos/room/logo'
    const withLogo = changeClubLogo({
      clubId: record.opponents[0]?.id ?? '',
      logoUrl,
      record
    })

    expect(withLogo.opponents[0]?.logoUrl).toBe(logoUrl)
    expect(withLogo.own.logoUrl).toBeNull()
    expect(
      changeClubLogo({
        clubId: record.opponents[0]?.id ?? '',
        logoUrl: null,
        record: withLogo
      }).opponents[0]?.logoUrl
    ).toBeNull()
  })

  it('[club] reads a record saved before the club had a hall or logos', () => {
    const { hall: _hall, ...older } = record
    const { logoUrl: _logo, ...ownWithoutLogo } = record.own
    const parsed = clubRecordSchema.parse({ ...older, own: ownWithoutLogo })

    expect(parsed.hall).toBeNull()
    expect(parsed.own.logoUrl).toBeNull()
  })
})
