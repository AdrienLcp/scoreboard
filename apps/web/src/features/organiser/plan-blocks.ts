import type { PublicSnapshot } from '@scoreboard/protocol/event-snapshot'
import type { TableNumber } from '@scoreboard/protocol/identifiers'

import {
  DEFAULT_OPPONENT_COLOUR,
  textColourOn
} from '@scoreboard/core/club/team-colours'
import { blockOf } from '@scoreboard/core/hall/hall-plan'

import {
  type EncounterLine,
  encounterLinesFor
} from '@/features/event/encounter-lines'
import { versusText } from '@/features/event/score-text'

/** What a block's handle shows: its encounter and the home team's colour. */
export type BlockLabel = {
  /** `null` wears ink: no encounter, or a white team. */
  colour: { background: string; text: string } | null
  encounter: string | null
}

/** "3–4": a block named by its two tables. */
export const blockNameOf = (first: TableNumber): string =>
  `${first}–${first + 1}`

/** The encounter seated on either table of the block holding this table. */
export const blockEncounterOf = (
  lines: readonly EncounterLine[],
  table: TableNumber
): EncounterLine | undefined =>
  lines.find((line) =>
    line.tables.some((seated) => blockOf(table).includes(seated))
  )

const homeColourOf = (
  event: PublicSnapshot,
  line: EncounterLine
): BlockLabel['colour'] => {
  const homeId = event.encounters.find(
    (encounter) => encounter.id === line.id
  )?.home

  if (homeId === undefined) {
    return null
  }

  const colour =
    event.teams.find((team) => team.id === homeId)?.colour ??
    DEFAULT_OPPONENT_COLOUR

  return colour.toUpperCase() === DEFAULT_OPPONENT_COLOUR
    ? null
    : { background: colour, text: textColourOn(colour) }
}

/** Each block of the hall by its first table: the encounter it hosts and its home team's colour. */
export const blockLabelsOf = ({
  event,
  tableCount
}: {
  event: PublicSnapshot
  tableCount: number
}): Map<TableNumber, BlockLabel> => {
  const lines = encounterLinesFor(event)

  return new Map(
    Array.from({ length: Math.ceil(tableCount / 2) }, (_, index) => {
      const first = 2 * index + 1
      const line = blockEncounterOf(lines, first)

      return [
        first,
        {
          colour: line === undefined ? null : homeColourOf(event, line),
          encounter:
            line === undefined ? null : versusText(line.homeName, line.awayName)
        }
      ]
    })
  )
}
