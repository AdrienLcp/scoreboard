import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { Encounter, Player } from '@scoreboard/protocol/event-setup'
import { setupWith } from '@scoreboard/protocol/testing/event-setups'

import {
  encounterLineupOf,
  seatedCountOf,
  seatLetter,
  withEncounterLineup
} from './encounter-lineups'
import { eventFormatOf } from './event-format'
import { addEncounter } from './setup-edits'

const encounter: Encounter = {
  away: randomUUID(),
  formatId: 'fftt-6-players-20-games',
  home: randomUUID(),
  id: randomUUID(),
  matchPoints: 'one-per-win'
}

const playerOn = (teamId: string, name: string): Player => ({
  id: randomUUID(),
  licence: null,
  name,
  points: null,
  teamId
})

const anna = playerOn(encounter.home, 'Anna Roy')
const bruno = playerOn(encounter.home, 'Bruno Roy')
const xavier = playerOn(encounter.away, 'Xavier Gall')

const day = addEncounter({
  encounter,
  lineups: { away: { X: xavier.id }, home: { A: anna.id } },
  newMatchId: randomUUID,
  setup: setupWith([], {
    players: [anna, bruno, xavier],
    tableCount: 8
  })
})

const NOTHING_STARTED = new Set<string>()

describe('encounter lineups', () => {
  it('[organiser] reads who holds each letter of a side off its singles lines', () => {
    const home = encounterLineupOf({ encounter, setup: day, side: 'home' })

    expect(home).toEqual([anna.id, null, null, null, null, null])
    expect(seatedCountOf(home)).toBe(1)
    expect(encounterLineupOf({ encounter, setup: day, side: 'away' })[0]).toBe(
      xavier.id
    )
  })

  it('[organiser] seats a letter on every line it plays, leaving the other side and the doubles', () => {
    const seated = withEncounterLineup({
      encounter,
      lineup: [anna.id, bruno.id],
      newPlayers: [],
      setup: day,
      side: 'home',
      startedMatchIds: NOTHING_STARTED
    })
    const bLines = seated.matches.filter((match) =>
      match.label?.startsWith('B')
    )

    expect(bLines.length).toBeGreaterThan(1)
    expect(bLines.every((match) => match.home.playerIds[0] === bruno.id)).toBe(
      true
    )
    expect(
      encounterLineupOf({ encounter, setup: seated, side: 'away' })
    ).toEqual(encounterLineupOf({ encounter, setup: day, side: 'away' }))
    expect(
      seated.matches
        .filter((match) => match.label?.startsWith('Double'))
        .every((match) => match.home.playerIds.length === 0)
    ).toBe(true)
  })

  it('[organiser] keeps the players of a line already started', () => {
    const firstALine = day.matches.find((match) => match.label?.startsWith('A'))
    const seated = withEncounterLineup({
      encounter,
      lineup: [bruno.id],
      newPlayers: [],
      setup: day,
      side: 'home',
      startedMatchIds: new Set([firstALine?.id ?? ''])
    })

    expect(
      seated.matches.find((match) => match.id === firstALine?.id)?.home
    ).toEqual({ playerIds: [anna.id] })
    expect(
      encounterLineupOf({ encounter, setup: seated, side: 'home' })[0]
    ).toBe(bruno.id)
  })

  it('[organiser] brings a player new to the day into it once seated', () => {
    const newcomer = playerOn(encounter.home, 'Claire Roy')
    const unseated = playerOn(encounter.home, 'Denis Roy')
    const seated = withEncounterLineup({
      encounter,
      lineup: [anna.id, null, newcomer.id],
      newPlayers: [newcomer, newcomer, unseated],
      setup: day,
      side: 'home',
      startedMatchIds: NOTHING_STARTED
    })

    expect(seated.players.map((player) => player.id)).toEqual([
      anna.id,
      bruno.id,
      xavier.id,
      newcomer.id
    ])
  })
})

describe('seatLetter', () => {
  it('[organiser] moves a player to the letter he is picked for, emptying the one he left', () => {
    expect(
      seatLetter({ index: 2, lineup: [anna.id, bruno.id], playerId: anna.id })
    ).toEqual([null, bruno.id, anna.id])
    expect(
      seatLetter({ index: 1, lineup: [anna.id, bruno.id], playerId: null })
    ).toEqual([anna.id, null])
  })
})

describe('eventFormatOf', () => {
  it('[organiser] reads the day’s format off what it already plays', () => {
    expect(eventFormatOf(setupWith([]))).toBeNull()
    expect(eventFormatOf(day)).toBe('championship')
  })
})
