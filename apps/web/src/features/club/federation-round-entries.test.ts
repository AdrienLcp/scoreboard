import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { clubRecordSchema } from '@scoreboard/protocol/club-record'
import type {
  FederationFixture,
  FederationPool
} from '@scoreboard/protocol/federation'
import { setupWith } from '@scoreboard/protocol/testing/event-setups'

import {
  placeEntries,
  roundEntriesOf,
  withPlayedEntries
} from './round-entries'

const OUR_NUMBER = '12850078'
const LUCON_NUMBER = '12850097'

const teamNamed = (name: string) => ({
  colour: '#FFFFFF',
  division: null,
  formatId: 'fftt-4-players-14-games',
  id: randomUUID(),
  lineup: [],
  name,
  tables: []
})

const angles1 = teamNamed('Angles 1')
const lucon1 = teamNamed('Luçon 1')
const marais1 = teamNamed('TT Marais 1')

const handPool = {
  division: null,
  id: randomUUID(),
  number: null,
  phase: 1,
  rounds: [
    {
      date: '2026-11-21',
      fixtures: [{ away: 2, home: 1, playedAs: null, result: null }]
    }
  ],
  season: 2026,
  teams: [angles1.id, lucon1.id, marais1.id, null]
}

const record = clubRecordSchema.parse({
  opponentColour: '#123456',
  opponents: [
    {
      id: randomUUID(),
      name: 'Luçon',
      number: LUCON_NUMBER,
      players: [],
      teams: [lucon1]
    },
    {
      id: randomUUID(),
      name: 'TT Marais',
      number: null,
      players: [],
      teams: [marais1]
    }
  ],
  own: {
    id: randomUUID(),
    name: 'Angles',
    number: OUR_NUMBER,
    players: [],
    teams: [angles1]
  },
  pools: [handPool]
})

const fixtureOf = (
  [homeTeam, homeClubNumber]: [string, string],
  [awayTeam, awayClubNumber]: [string, string]
): FederationFixture => ({
  awayClubNumber,
  awayScore: null,
  awayTeam,
  encounter: null,
  homeClubNumber,
  homeScore: null,
  homeTeam
})

const OURS: [string, string] = ['PPC ANGLES (1)', OUR_NUMBER]

const federationPool: FederationPool = {
  reference: { division: '200001', organiser: '85', pool: '300001' },
  rounds: [
    {
      date: '2026-11-14',
      fixtures: [fixtureOf(OURS, ['LUCON TT (1)', LUCON_NUMBER])],
      number: 1
    },
    {
      date: '2026-11-28',
      fixtures: [fixtureOf(['TT MARAIS (1)', '12859902'], OURS)],
      number: 2
    },
    {
      date: '2026-12-12',
      fixtures: [fixtureOf(OURS, ['CPTT GRAND LARGE (1)', '12859906'])],
      number: 3
    }
  ],
  standings: []
}

const federationPools = new Map([[handPool.id, federationPool]])

const entryOn = (day: string) => {
  const [entry] = roundEntriesOf(record, day, federationPools)

  if (entry === undefined) {
    throw new Error(`No entry on ${day}`)
  }

  return entry
}

describe('round entries from the FFTT calendar', () => {
  it('[club] takes the round of the FFTT’s weekend over the hand-kept date, its opponent tied by FFTT number', () => {
    const entry = entryOn('2026-11-15')

    expect(entry).toMatchObject({
      date: '2026-11-14',
      isFromFederation: true,
      kept: { at: { fixtureIndex: 0, roundIndex: 0 } },
      ownNumber: 1,
      ownSide: 'home',
      roundNumber: 1
    })
    expect(entry.home?.team.id).toBe(angles1.id)
    expect(entry.away?.team.id).toBe(lucon1.id)
  })

  it('[club] keeps the hand-kept pool when the FFTT has not answered for it', () => {
    const [entry] = roundEntriesOf(record, '2026-11-15')

    expect(entry).toMatchObject({
      date: '2026-11-21',
      isFromFederation: false,
      roundNumber: 1
    })
  })

  it('[club] finds an opponent the club typed by its name, the hall being the FFTT’s', () => {
    const entry = entryOn('2026-11-22')

    expect(entry).toMatchObject({
      kept: null,
      ownSide: 'away',
      roundNumber: 2
    })
    expect(entry.home?.team.id).toBe(marais1.id)
  })

  it('[club] brings an opponent nobody holds into the day only, under the same id every time', () => {
    const entry = entryOn('2026-12-12')
    const { placed, setup } = placeEntries({
      entries: [entry],
      newEncounterId: randomUUID,
      newMatchId: randomUUID,
      setup: setupWith([], { tableCount: 8 })
    })

    expect(entry.away?.team).toMatchObject({
      colour: '#123456',
      formatId: angles1.formatId,
      name: 'CPTT GRAND LARGE 1'
    })
    expect(entry.away?.club.name).toBe('CPTT GRAND LARGE')
    expect(entryOn('2026-12-12').away?.team.id).toBe(entry.away?.team.id)
    expect(placed).toHaveLength(1)
    expect(setup.encounters[0]?.away).toBe(entry.away?.team.id)
    expect(
      withPlayedEntries({ eventId: randomUUID(), placed, record }).opponents
    ).toEqual(record.opponents)
  })

  it('[club] writes the sheet’s encounter back to the hand-kept fixture', () => {
    const entry = entryOn('2026-11-14')
    const eventId = randomUUID()
    const encounterId = randomUUID()
    const next = withPlayedEntries({
      eventId,
      placed: [{ encounterId, entry, tables: [] }],
      record
    })

    expect(next.pools[0]?.rounds[0]?.fixtures[0]?.playedAs).toEqual({
      encounterId,
      eventId
    })
  })
})
