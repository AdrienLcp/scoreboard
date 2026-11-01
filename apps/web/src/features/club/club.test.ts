import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import {
  type ClubRecord,
  clubRecordSchema,
  type DirectoryClub,
  type DirectoryTeam
} from '@scoreboard/protocol/club-record'

import { defaultHallPlan } from '@scoreboard/core/hall/hall-plan'

import {
  absentSeatsLast,
  addTypedOpponentTeam,
  addTypedPlayer,
  addTypedTeam,
  changeClubLogo,
  keepHallPlan,
  keepLineup,
  markPlayed
} from './club-edits'
import {
  byRecentThenName,
  clubNameOfTeam,
  matchesTyped,
  splitTypedName
} from './directory-search'

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
  own,
  pools: []
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

  it('[club] adds a typed licensee to his club, as a first and a family name', () => {
    const added = addTypedPlayer({
      clubId: record.opponents[0]?.id ?? '',
      newPlayerId: randomUUID,
      record,
      typed: 'DUPONT Jean-Marc'
    })

    expect(added?.record.opponents[0]?.players).toEqual([
      {
        firstName: 'Jean-Marc',
        id: added?.playerId,
        lastName: 'DUPONT',
        licence: null,
        points: null,
        source: 'typed'
      }
    ])
    expect(
      addTypedPlayer({
        clubId: record.own.id,
        newPlayerId: randomUUID,
        record,
        typed: 'Dupont'
      })
    ).toBeNull()
  })

  it('[club] puts a typed opposing team in the club its name starts with, creating it when new', () => {
    const intoKnown = addTypedOpponentTeam({
      newClubId: randomUUID,
      newTeamId: randomUUID,
      record,
      typed: 'rivals 3'
    })
    const intoNew = addTypedOpponentTeam({
      newClubId: randomUUID,
      newTeamId: randomUUID,
      record,
      typed: 'Riverside 4'
    })

    expect(intoKnown.record.opponents).toHaveLength(1)
    expect(intoKnown.record.opponents[0]?.teams.at(-1)).toMatchObject({
      colour: '#FFFFFF',
      id: intoKnown.teamId,
      name: 'rivals 3'
    })
    expect(intoNew.record.opponents.at(-1)).toMatchObject({
      name: 'Riverside',
      teams: [{ id: intoNew.teamId, name: 'Riverside 4' }]
    })
  })

  it('[club] knows a club by its teams names, "Riverside 4" joining the "TT Riverside" of "Riverside 1"', () => {
    const riverside = recordWith(
      clubOf('PPC Angles', [angles]),
      clubOf('TT Riverside', [teamOf('Riverside 1')])
    )
    const added = addTypedOpponentTeam({
      newClubId: randomUUID,
      newTeamId: randomUUID,
      record: riverside,
      typed: 'Riverside 4'
    })

    expect(added.record.opponents).toHaveLength(1)
    expect(added.record.opponents[0]?.teams.at(-1)?.id).toBe(added.teamId)
  })

  it('[club] puts a typed team named after our club in our teams, on the next free tables', () => {
    const ours = addTypedTeam({
      newClubId: randomUUID,
      newTeamId: randomUUID,
      record,
      typed: 'Angles 3 '
    })
    const theirs = addTypedTeam({
      newClubId: randomUUID,
      newTeamId: randomUUID,
      record,
      typed: 'Rivals 5'
    })

    expect(ours.record.opponents).toEqual(record.opponents)
    expect(ours.record.own.teams.at(-1)).toMatchObject({
      id: ours.teamId,
      name: 'Angles 3',
      tables: [3, 4]
    })
    expect(theirs.record.own).toEqual(record.own)
    expect(theirs.record.opponents[0]?.teams.at(-1)).toMatchObject({
      id: theirs.teamId,
      name: 'Rivals 5'
    })
  })

  it('[club] stamps the day on the teams and players an encounter brings', () => {
    const playerId = randomUUID()
    const withPlayer = {
      ...record,
      own: {
        ...record.own,
        players: [
          {
            firstName: 'Léa',
            id: playerId,
            lastName: 'Martin',
            licence: null,
            points: null,
            source: 'typed' as const
          }
        ]
      }
    }
    const marked = markPlayed({
      on: '2026-11-01',
      playerIds: [playerId],
      record: withPlayer,
      teamIds: [rivals.id]
    })

    expect(marked.own.players[0]?.lastPlayedOn).toBe('2026-11-01')
    expect(marked.opponents[0]?.teams[0]?.lastPlayedOn).toBe('2026-11-01')
    expect(marked.own.teams[0]?.lastPlayedOn).toBeUndefined()
  })

  it('[club] moves an empty seat of the first group behind the second, players kept in order', () => {
    const [a, b, d, e, f] = ['a', 'b', 'd', 'e', 'f']

    expect(
      absentSeatsLast({
        groupSize: 3,
        letterCount: 6,
        lineup: [a, b, null, d, e, f]
      })
    ).toEqual([a, b, d, e, f, null])
    expect(
      absentSeatsLast({
        groupSize: 3,
        letterCount: 6,
        lineup: [a, b, d, e, null, f]
      })
    ).toBeNull()
    expect(
      absentSeatsLast({ groupSize: 3, letterCount: 6, lineup: [a, b] })
    ).toBeNull()
    expect(
      absentSeatsLast({ groupSize: 3, letterCount: 3, lineup: [a, null, b] })
    ).toBeNull()
  })
})

describe('directory search', () => {
  it('[club] finds a name from the first letters of any of its words, accents aside', () => {
    expect(matchesTyped('Jean Dupont', 'dup j')).toBe(true)
    expect(matchesTyped('Léna Martin', 'lena')).toBe(true)
    expect(matchesTyped('Jean-Pierre Martin', 'pie')).toBe(true)
    expect(matchesTyped('Jean Dupont', 'pont')).toBe(false)
    expect(matchesTyped('Jean Dupont', '')).toBe(true)
  })

  it('[club] reads a typed name either way the sheet or a person writes it', () => {
    expect(splitTypedName('Jean Le Goff')).toEqual({
      firstName: 'Jean',
      lastName: 'Le Goff'
    })
    expect(splitTypedName('LE GOFF Jean')).toEqual({
      firstName: 'Jean',
      lastName: 'LE GOFF'
    })
    expect(splitTypedName('  Jean  ')).toBeNull()
  })

  it('[club] reads the club of a typed team from its name', () => {
    expect(clubNameOfTeam('La Roche 12')).toBe('La Roche')
    expect(clubNameOfTeam('Riverside')).toBe('Riverside')
  })

  it('[club] orders the most recently played first, then by name', () => {
    const entries = [
      { lastPlayedOn: undefined, name: 'Angles' },
      { lastPlayedOn: '2026-10-18', name: 'Eastfield' },
      { lastPlayedOn: '2026-11-01', name: 'Riverside' },
      { lastPlayedOn: undefined, name: 'Ashford' }
    ]

    expect(
      entries
        .toSorted(byRecentThenName((entry: (typeof entries)[number]) => entry))
        .map((entry) => entry.name)
    ).toEqual(['Riverside', 'Eastfield', 'Angles', 'Ashford'])
  })
})
