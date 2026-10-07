import type { PublicSnapshot } from '@scoreboard/protocol/event-snapshot'
import type { EncounterId, TableNumber } from '@scoreboard/protocol/identifiers'
import type { Score } from '@scoreboard/protocol/side'

import { versusText } from './score-text'

/** A team encounter as every screen sums it up: both teams, the running score, its tables. */
export type EncounterLine = {
  awayName: string
  homeName: string
  id: EncounterId
  points: Score
  tables: TableNumber[]
}

export const encounterLinesFor = (
  snapshot: PublicSnapshot
): EncounterLine[] => {
  const teamName = (teamId: string): string =>
    snapshot.teams.find((team) => team.id === teamId)?.name ?? ''

  return snapshot.encounters.map((encounter) => {
    const matches = snapshot.matches.filter(
      (match) => match.encounterId === encounter.id
    )
    const tables = [
      ...new Set(
        matches.flatMap((match) => (match.table === null ? [] : [match.table]))
      )
    ].toSorted((left, right) => left - right)

    return {
      awayName: teamName(encounter.away),
      homeName: teamName(encounter.home),
      id: encounter.id,
      points: snapshot.encounterViews.find((view) => view.id === encounter.id)
        ?.points ?? { away: 0, home: 0 },
      tables
    }
  })
}

/** "Club A – Club B": how a match of the encounter is introduced. */
export const encounterTitleOf = (line: EncounterLine): string =>
  versusText(line.homeName, line.awayName)
