import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { EncounterId, TableNumber } from '@scoreboard/protocol/identifiers'
import type { Score } from '@scoreboard/protocol/side'

import { currentMatchOn } from '@/features/event/table-match'
import { paintOf, type TeamPaint } from '@/features/event/team-paint'

/** More encounters than this and a row stops being legible: the open board takes over. */
export const MAX_WALL_ROWS = 6

/** One table of an encounter's row: the match played on it, or the one it waits for. */
export type WallTable = {
  live: MatchView | null
  next: MatchView | null
  table: TableNumber
}

/** One encounter on the wall: both teams, the parties won so far, its tables. */
export type WallRow = {
  away: TeamPaint
  home: TeamPaint
  id: EncounterId
  /** Every match of the encounter's sheet: cards follow a player from one to the next. */
  matches: readonly MatchView[]
  points: Score
  tables: WallTable[]
}

/** A table as the wall shows it: its match live, or the one it waits for, or free. */
export const wallTableOf = (
  current: MatchView,
  table: TableNumber
): WallTable => ({
  live: current.state.status === 'live' ? current : null,
  next: current.state.status === 'scheduled' ? current : null,
  table
})

const wallTableFor = (
  snapshot: PublicSnapshot,
  table: TableNumber
): { encounterId: EncounterId | null; wallTable: WallTable } | null => {
  const current = currentMatchOn(snapshot, table)

  return current === null
    ? null
    : {
        encounterId: current.encounterId,
        wallTable: wallTableOf(current, table)
      }
}

/**
 * The wall's rows when every table this screen shows belongs to a team
 * encounter played on at most two tables, one row per encounter in table
 * order; `null` when the open board suits the day better.
 */
export const wallRowsFor = ({
  snapshot,
  tables
}: {
  snapshot: PublicSnapshot
  tables: readonly TableNumber[]
}): WallRow[] | null => {
  const byEncounter = new Map<EncounterId, WallTable[]>()

  for (const table of tables) {
    const found = wallTableFor(snapshot, table)

    if (found === null) {
      continue
    }

    if (found.encounterId === null) {
      return null
    }

    byEncounter.set(found.encounterId, [
      ...(byEncounter.get(found.encounterId) ?? []),
      found.wallTable
    ])
  }

  const groups = [...byEncounter]

  if (
    groups.length === 0 ||
    groups.length > MAX_WALL_ROWS ||
    groups.some(([, wallTables]) => wallTables.length > 2)
  ) {
    return null
  }

  return groups.flatMap(([encounterId, wallTables]): WallRow[] => {
    const encounter = snapshot.encounters.find(
      (candidate) => candidate.id === encounterId
    )

    if (encounter === undefined) {
      return []
    }

    const teamOf = (teamId: string) =>
      snapshot.teams.find((team) => team.id === teamId)

    return [
      {
        away: paintOf(teamOf(encounter.away)),
        home: paintOf(teamOf(encounter.home)),
        id: encounterId,
        matches: snapshot.matches.filter(
          (match) => match.encounterId === encounterId
        ),
        points: snapshot.encounterViews.find((view) => view.id === encounterId)
          ?.points ?? { away: 0, home: 0 },
        tables: wallTables
      }
    ]
  })
}
