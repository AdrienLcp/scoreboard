import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { Encounter, MatchSetup } from '@scoreboard/protocol/event-setup'
import type { PlayerId } from '@scoreboard/protocol/identifiers'

import { encounterFormatFor } from './encounter-formats'
import { sheetMatchesFor } from './encounter-sheet'
import { umpireCandidatesOf, umpireOf } from './umpire-turn'

const ENCOUNTER: Encounter = {
  away: randomUUID(),
  formatId: 'fftt-6-players-20-games',
  home: randomUUID(),
  id: randomUUID(),
  matchPoints: 'one-per-win'
}

/** A team's sheet letters, given group by group, each held by a new player. */
const lettersOf = (...groups: string[]): Record<string, PlayerId> =>
  Object.fromEntries(
    [...groups.join('')].map((letter) => [letter, randomUUID()])
  )

const HOME = lettersOf('ABC', 'DEF')
const AWAY = lettersOf('XYZ', 'RST')

const SHEET = sheetMatchesFor({
  encounter: ENCOUNTER,
  format: encounterFormatFor('fftt-6-players-20-games'),
  lineups: { away: AWAY, home: HOME },
  newMatchId: randomUUID,
  tables: [1, 2]
})

const lineOf = (label: string, sheet = SHEET): MatchSetup => {
  const match = sheet.find((candidate) => candidate.label === label)

  if (match === undefined) {
    throw new Error(`No line ${label} on the sheet`)
  }

  return match
}

const umpireOn = (label: string, sheet = SHEET): PlayerId | null =>
  umpireOf({ encounterMatches: sheet, match: lineOf(label, sheet) })

const sideOf = (playerId: PlayerId | null): 'home' | 'away' | null =>
  playerId === null
    ? null
    : Object.values(HOME).includes(playerId)
      ? 'home'
      : 'away'

describe('umpireOf', () => {
  it('[umpire] hands the table to the player who has just played on it, from the club whose turn it is', () => {
    expect(umpireOn('BY')).toBe(AWAY.X)
    expect(umpireOn('CZ')).toBe(HOME.B)
    expect(umpireOn('ES')).toBe(HOME.D)
  })

  it('[umpire] takes the clubs in turn on each table, the two tables never with the same club at once', () => {
    const tableOne = SHEET.filter((match) => match.table === 1).slice(0, 4)
    const tableTwo = SHEET.filter((match) => match.table === 2).slice(0, 4)
    const sidesOn = (matches: readonly MatchSetup[]) =>
      matches.map((match) =>
        sideOf(umpireOf({ encounterMatches: SHEET, match }))
      )

    expect(sidesOn(tableOne)).toEqual(['home', 'away', 'home', 'away'])
    expect(sidesOn(tableTwo)).toEqual(['away', 'home', 'away', 'home'])
  })

  it('[umpire] never gives a match to one of its players or to someone playing on the other table meanwhile', () => {
    const tableTwo = SHEET.filter((match) => match.table === 2)

    SHEET.filter((match) => match.table === 1).forEach((match, turn) => {
      const umpire = umpireOf({ encounterMatches: SHEET, match })
      const meanwhile = tableTwo.at(turn)

      expect(umpire).not.toBeNull()
      expect([
        ...match.home.playerIds,
        ...match.away.playerIds,
        ...(meanwhile?.home.playerIds ?? []),
        ...(meanwhile?.away.playerIds ?? [])
      ]).not.toContain(umpire)
    })
  })

  it("[umpire] keeps the organiser's choice, or nobody when he said so", () => {
    const sheet = SHEET.map((match) =>
      match.label === 'AX'
        ? { ...match, umpireId: HOME.F }
        : match.label === 'DR'
          ? { ...match, umpireId: null }
          : match
    )

    expect(umpireOn('AX', sheet)).toBe(HOME.F)
    expect(umpireOn('DR', sheet)).toBeNull()
  })

  it('[umpire] drops a chosen umpire who now plays the match, back to the turn', () => {
    const sheet = SHEET.map((match) =>
      match.label === 'BY' ? { ...match, umpireId: HOME.B } : match
    )

    expect(umpireOn('BY', sheet)).toBe(AWAY.X)
  })

  it('[umpire] names nobody while no player of the encounter is known', () => {
    const blank = SHEET.map((match) => ({
      ...match,
      away: { playerIds: [] },
      home: { playerIds: [] }
    }))

    expect(umpireOn('AX', blank)).toBeNull()
  })
})

describe('umpireCandidatesOf', () => {
  it("[umpire] offers every player of the encounter but the match's own, the sheet's pick first", () => {
    const match = lineOf('BY')
    const candidates = umpireCandidatesOf({ encounterMatches: SHEET, match })

    expect(candidates.at(0)).toEqual({ playerId: AWAY.X, side: 'away' })
    expect(candidates).toHaveLength(10)
    expect(candidates.map(({ playerId }) => playerId)).not.toContain(HOME.B)
    expect(candidates.map(({ playerId }) => playerId)).not.toContain(AWAY.Y)
  })
})
