import type { EncounterFormatId } from '@scoreboard/protocol/encounter-format-id'

import type {
  EncounterFormat,
  MatchPoints,
  SheetLine
} from './encounter-format'

/** Règlements sportifs FFTT, art. 26.2: 2 points for a win, 1 for a loss played out or abandoned, 0 for a match not played. */
const FFTT_MATCH_POINTS: MatchPoints = {
  loss: 1,
  retirement: 1,
  walkover: 0,
  win: 2
}

const singles = (home: string, away: string): SheetLine => ({
  away,
  home,
  kind: 'singles'
})

const doubles = (number: number): SheetLine => ({ kind: 'doubles', number })

/**
 * The FFTT team championship sheets, as the 2025-2026 departmental
 * regulations print them (CDTT 91, "Règlement Championnat de France par
 * équipes", art. 13 and 16). Every match is played, in this order, best of
 * five games to 11.
 */
export const ENCOUNTER_FORMATS = {
  'fftt-3-players-10-games': {
    awayLetters: ['X', 'Y', 'Z'],
    homeLetters: ['A', 'B', 'C'],
    matchFormat: { bestOf: 5, pointsPerGame: 11, sport: 'table-tennis' },
    matchPoints: FFTT_MATCH_POINTS,
    sheet: [
      singles('A', 'X'),
      singles('B', 'Y'),
      singles('C', 'Z'),
      singles('B', 'X'),
      singles('A', 'Z'),
      singles('C', 'Y'),
      doubles(1),
      singles('B', 'Z'),
      singles('C', 'X'),
      singles('A', 'Y')
    ]
  },
  'fftt-4-players-14-games': {
    awayLetters: ['W', 'X', 'Y', 'Z'],
    homeLetters: ['A', 'B', 'C', 'D'],
    matchFormat: { bestOf: 5, pointsPerGame: 11, sport: 'table-tennis' },
    matchPoints: FFTT_MATCH_POINTS,
    sheet: [
      singles('A', 'W'),
      singles('B', 'X'),
      singles('C', 'Y'),
      singles('D', 'Z'),
      singles('A', 'X'),
      singles('B', 'W'),
      singles('D', 'Y'),
      singles('C', 'Z'),
      doubles(1),
      doubles(2),
      singles('A', 'Y'),
      singles('C', 'W'),
      singles('D', 'X'),
      singles('B', 'Z')
    ]
  }
} as const satisfies Record<EncounterFormatId, EncounterFormat>

export const encounterFormatFor = (id: EncounterFormatId): EncounterFormat =>
  ENCOUNTER_FORMATS[id]
