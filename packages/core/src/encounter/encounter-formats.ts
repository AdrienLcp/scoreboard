import type { EncounterFormatId } from '@scoreboard/protocol/encounter-format-id'

import type { EncounterFormat, SheetGroup, SheetLine } from './encounter-format'

const singles = (
  home: string,
  away: string,
  group: SheetGroup = 1
): SheetLine => ({
  away,
  group,
  home,
  kind: 'singles'
})

const doubles = (number: number, group: SheetGroup = 1): SheetLine => ({
  group,
  kind: 'doubles',
  number
})

const BEST_OF_FIVE_TO_ELEVEN = {
  bestOf: 5,
  pointsPerGame: 11,
  sport: 'table-tennis'
} as const

/**
 * The FFTT team championship sheets, as the 2025-2026 departmental
 * regulations print them (CDTT 91, "Règlement Championnat de France par
 * équipes", art. 13 and 16; the 6-player one from a signed departmental D2 sheet).
 * Every match is played, in this order, best of five games to 11.
 */
export const ENCOUNTER_FORMATS = {
  'fftt-3-players-10-games': {
    awayLetters: ['X', 'Y', 'Z'],
    groupCount: 1,
    homeLetters: ['A', 'B', 'C'],
    matchFormat: BEST_OF_FIVE_TO_ELEVEN,
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
    groupCount: 1,
    homeLetters: ['A', 'B', 'C', 'D'],
    matchFormat: BEST_OF_FIVE_TO_ELEVEN,
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
  },
  /** Two groups of three, ABC–XYZ and DEF–RST, one table each; odd lines are the first group. */
  'fftt-6-players-20-games': {
    awayLetters: ['X', 'Y', 'Z', 'R', 'S', 'T'],
    groupCount: 2,
    homeLetters: ['A', 'B', 'C', 'D', 'E', 'F'],
    matchFormat: BEST_OF_FIVE_TO_ELEVEN,
    sheet: [
      singles('A', 'X'),
      singles('D', 'R', 2),
      singles('B', 'Y'),
      singles('E', 'S', 2),
      singles('C', 'Z'),
      singles('F', 'T', 2),
      singles('B', 'X'),
      doubles(1, 2),
      singles('A', 'Z'),
      singles('E', 'R', 2),
      singles('C', 'Y'),
      singles('D', 'T', 2),
      doubles(2),
      singles('F', 'S', 2),
      singles('B', 'Z'),
      singles('E', 'T', 2),
      singles('C', 'X'),
      singles('F', 'R', 2),
      singles('A', 'Y'),
      singles('D', 'S', 2)
    ]
  }
} as const satisfies Record<EncounterFormatId, EncounterFormat>

export const encounterFormatFor = (id: EncounterFormatId): EncounterFormat =>
  ENCOUNTER_FORMATS[id]
