import type {
  Encounter,
  MatchSetup,
  Participant
} from '@scoreboard/protocol/event-setup'
import type { MatchId, PlayerId } from '@scoreboard/protocol/identifiers'

import type { EncounterFormat, SheetLine } from './encounter-format'

/** Which player holds each letter of a team's sheet. A letter left out has nobody yet. */
export type Lineup = Readonly<Partial<Record<string, PlayerId>>>

const participantFor = (lineup: Lineup, letter: string): Participant => {
  const playerId = lineup[letter]

  return { playerIds: playerId === undefined ? [] : [playerId] }
}

const DOUBLES_LABEL_PREFIX = 'Double'

const labelFor = (line: SheetLine): string =>
  line.kind === 'singles'
    ? `${line.home}${line.away}`
    : `${DOUBLES_LABEL_PREFIX} ${line.number}`

/**
 * The matches of an encounter's sheet, in playing order. A doubles starts with
 * no players: teams name their pairs during the encounter.
 */
export const sheetMatchesFor = ({
  encounter,
  format,
  lineups,
  newMatchId
}: {
  encounter: Encounter
  format: EncounterFormat
  lineups: { away: Lineup; home: Lineup }
  newMatchId: () => MatchId
}): MatchSetup[] =>
  format.sheet.map((line) => ({
    away:
      line.kind === 'singles'
        ? participantFor(lineups.away, line.away)
        : { playerIds: [] },
    encounterId: encounter.id,
    format: format.matchFormat,
    home:
      line.kind === 'singles'
        ? participantFor(lineups.home, line.home)
        : { playerIds: [] },
    id: newMatchId(),
    label: labelFor(line),
    table: null
  }))
