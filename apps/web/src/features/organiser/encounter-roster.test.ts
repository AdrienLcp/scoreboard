import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { DirectoryPlayer } from '@scoreboard/protocol/club-record'
import type { Player } from '@scoreboard/protocol/event-setup'
import type { FederationPlayer } from '@scoreboard/protocol/federation'

import {
  clubRosterOf,
  federationFamilyName,
  federationPickOf,
  licenceOfPick
} from './encounter-roster'

const LETTERS = ['X', 'Y', 'Z']

const typed = (
  firstName: string,
  lastName: string,
  extra: Partial<DirectoryPlayer> = {}
): DirectoryPlayer => ({
  firstName,
  id: randomUUID(),
  lastName,
  licence: null,
  points: null,
  source: 'typed',
  ...extra
})

const licensee = (
  firstName: string,
  lastName: string,
  licence: string,
  points: number
): FederationPlayer => ({
  category: 'S',
  clubName: 'LUCON TENNIS DE TABLE',
  clubNumber: '12850097',
  firstName,
  lastName,
  licence,
  monthlyPoints: points,
  points,
  sex: 'M'
})

const LICENSEES = [
  licensee('Pierre', 'AUVINET', '8599101', 1520),
  licensee('Lucas', 'BERTHOMÉ', '8599102', 1465),
  licensee('Inès', 'COUSSEAU', '8599103', 1410)
]

describe('clubRosterOf', () => {
  it('lists those who played first, then the licensees, then the typed only, each by points', () => {
    const auvinet = typed('Pierre', 'Auvinet', { lastPlayedOn: '2026-10-18' })
    const newcomer = typed('Jean', 'Nouveau', { points: 900 })

    const groups = clubRosterOf({
      directory: [auvinet, newcomer],
      letters: LETTERS,
      licensees: LICENSEES,
      players: [],
      seats: [null, null, null],
      teamLineup: [],
      typed: ''
    })

    expect(
      groups.map((group) => [group.kind, group.rows.map((row) => row.name)])
    ).toEqual([
      ['played', ['Pierre Auvinet']],
      ['licensees', ['Lucas Berthomé', 'Inès Cousseau']],
      ['typed', ['Jean Nouveau']]
    ])
    expect(groups[0]?.rows[0]).toMatchObject({
      id: auvinet.id,
      licence: '8599101',
      points: 1520,
      source: 'fftt'
    })
  })

  it('marks the letter a licensee already holds through the day player he became', () => {
    const seated: Player = {
      id: randomUUID(),
      licence: '8599102',
      name: 'Lucas Berthomé',
      points: 1465,
      teamId: randomUUID()
    }

    const rows = clubRosterOf({
      directory: [],
      letters: LETTERS,
      licensees: LICENSEES,
      players: [seated],
      seats: [null, seated.id, null],
      teamLineup: [],
      typed: ''
    }).flatMap((group) => group.rows)

    expect(rows.find((row) => row.licence === '8599102')?.seat).toBe('Y')
  })

  it('narrows on the first letters of a name, or on a licence', () => {
    const search = (typedText: string) =>
      clubRosterOf({
        directory: [],
        letters: LETTERS,
        licensees: LICENSEES,
        players: [],
        seats: [],
        teamLineup: [],
        typed: typedText
      }).flatMap((group) => group.rows.map((row) => row.name))

    expect(search('cou')).toEqual(['Inès Cousseau'])
    expect(search('8599101')).toEqual(['Pierre Auvinet'])
  })

  it('keeps the typed players alone while the FFTT has not answered', () => {
    const groups = clubRosterOf({
      directory: [typed('Jean', 'Nouveau')],
      letters: LETTERS,
      licensees: null,
      players: [],
      seats: [],
      teamLineup: [],
      typed: ''
    })

    expect(groups.map((group) => group.kind)).toEqual(['typed'])
  })
})

describe('federation picks', () => {
  it('carry the licence of a licensee who is in no directory', () => {
    expect(licenceOfPick(federationPickOf('8599103'))).toBe('8599103')
    expect(licenceOfPick(randomUUID())).toBeNull()
  })

  it('write family names the way the club types them', () => {
    expect(federationFamilyName('LE GALL-BRIAND')).toBe('Le Gall-Briand')
  })
})
