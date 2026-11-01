import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type {
  DirectoryClub,
  DirectoryPlayer,
  DirectoryTeam
} from '@scoreboard/protocol/club-record'
import { setupWith } from '@scoreboard/protocol/testing/event-setups'

import { encounterFormatFor } from '../encounter/encounter-formats'
import { addClubEncounter, defaultTablesFor } from './club-encounter'
import { nextTeamColour, TEAM_COLOURS, textColourOn } from './team-colours'

const D6 = encounterFormatFor('fftt-6-players-20-games')

const licensee = (lastName: string): DirectoryPlayer => ({
  firstName: 'Léa',
  id: randomUUID(),
  lastName,
  licence: null,
  points: 812,
  source: 'typed'
})

const teamOf = (
  players: readonly DirectoryPlayer[],
  overrides: Partial<DirectoryTeam> = {}
): DirectoryTeam => ({
  colour: TEAM_COLOURS[1],
  division: 'D2',
  formatId: 'fftt-6-players-20-games',
  id: randomUUID(),
  lineup: players.map((player) => player.id),
  matchPoints: 'one-per-win',
  name: 'Angles 2',
  tables: [3, 4],
  ...overrides
})

const clubOf = (
  players: DirectoryPlayer[],
  teams: DirectoryTeam[],
  logoUrl: string | null = null
): DirectoryClub => ({
  id: randomUUID(),
  logoUrl,
  name: 'PPC Angles',
  number: null,
  players,
  teams
})

const ANGLES_LOGO = '/api/logos/room/angles'

describe('team colours', () => {
  it('[club] writes ink on light team colours and white on the dark green', () => {
    expect(textColourOn('#8FCBEF')).toBe('#0E2238')
    expect(textColourOn('#007A42')).toBe('#FFFFFF')
  })

  it('[club] gives a new team the first colour nobody wears', () => {
    expect(nextTeamColour(['#8fcbef'])).toBe(TEAM_COLOURS[1])
  })
})

describe('defaultTablesFor', () => {
  it('[club] keeps the home team its own pair of tables when free', () => {
    expect(
      defaultTablesFor({
        format: D6,
        preferred: [3, 4],
        setup: setupWith([], { tableCount: 8 })
      })
    ).toEqual([3, 4])
  })

  it('[club] falls back to the first free pair when its own is taken', () => {
    const players = Array.from({ length: 6 }, (_, index) =>
      licensee(`N${index}`)
    )
    const home = {
      club: clubOf(players, []),
      team: teamOf(players, { tables: [1, 2] })
    }
    const away = {
      club: clubOf([], []),
      team: teamOf([], { name: 'Rivals 2' })
    }
    const setup = addClubEncounter({
      away,
      awayColour: '#FFFFFF',
      encounterId: randomUUID(),
      home,
      newMatchId: randomUUID,
      setup: setupWith([], { players: [], tableCount: 8 }),
      tables: [1, 2]
    })

    expect(defaultTablesFor({ format: D6, preferred: [1, 2], setup })).toEqual([
      3, 4
    ])
  })
})

describe('addClubEncounter', () => {
  const players = Array.from({ length: 6 }, (_, index) => licensee(`N${index}`))
  const home = {
    club: clubOf(players, [], ANGLES_LOGO),
    team: teamOf(players)
  }
  const away = { club: clubOf([], []), team: teamOf([], { name: 'Rivals 2' }) }
  const setup = addClubEncounter({
    away,
    awayColour: '#FFFFFF',
    encounterId: randomUUID(),
    home,
    newMatchId: randomUUID,
    setup: setupWith([], { players: [], tableCount: 8 }),
    tables: [3, 4]
  })

  it('[club] brings both teams with their colours and the home composition', () => {
    expect(setup.teams.map((team) => [team.name, team.colour])).toEqual([
      ['Angles 2', TEAM_COLOURS[1]],
      ['Rivals 2', '#FFFFFF']
    ])
    expect(setup.players.map((player) => player.name)).toEqual(
      players.map((player) => `Léa ${player.lastName}`)
    )
    expect(setup.players[0]?.points).toBe(812)
  })

  it('[club] gives each team its club logo, none for a club without one', () => {
    expect(setup.teams.map((team) => team.logoUrl)).toEqual([ANGLES_LOGO, null])
  })

  it('[club] seats letter D on the second table of the pair', () => {
    expect(setup.matches[1]).toMatchObject({
      home: { playerIds: [players[3]?.id] },
      label: 'DR',
      table: 4
    })
    expect(setup.encounters[0]?.matchPoints).toBe('one-per-win')
  })
})
