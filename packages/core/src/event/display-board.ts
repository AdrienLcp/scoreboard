import type { Display } from '@scoreboard/protocol/event-setup'
import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { DisplayId, TableNumber } from '@scoreboard/protocol/identifiers'

import { tableNumbers } from './table-queue'

/**
 * What a table is doing, as the display tells it:
 * - `live` — a match is being played on it
 * - `upcoming` — its next match has not started
 * - `finished` — every match it was given is over; the last one is shown
 * - `idle` — it was given no match at all
 */
export type TablePhase = 'live' | 'upcoming' | 'finished' | 'idle'

export type TableTile = {
  match: MatchView | null
  phase: TablePhase
  table: TableNumber
}

/**
 * A display's board: live tables get the space, the others fold into a
 * summary. Both lists stay in table order, so a tile only moves when its
 * match starts or ends.
 */
export type DisplayBoard = {
  live: TableTile[]
  quiet: TableTile[]
}

/**
 * The tables a display shows: those its organiser gave it, or every table for
 * the default display. `null` for a display the event does not have.
 */
export const tablesShownOn = ({
  displayId,
  displays,
  tableCount
}: {
  displayId: DisplayId | null
  displays: readonly Display[]
  tableCount: number
}): TableNumber[] | null => {
  if (displayId === null) {
    return tableNumbers(tableCount)
  }

  const display = displays.find((candidate) => candidate.id === displayId)

  return display === undefined
    ? null
    : display.tables
        .filter((table) => table <= tableCount)
        .toSorted((left, right) => left - right)
}

const tileFor = (snapshot: PublicSnapshot, table: TableNumber): TableTile => {
  const currentId = snapshot.tables.find(
    (view) => view.number === table
  )?.matchId
  const current = snapshot.matches.find((match) => match.id === currentId)

  if (current !== undefined) {
    return {
      match: current,
      phase: current.state.status === 'live' ? 'live' : 'upcoming',
      table
    }
  }

  const lastPlayed = snapshot.matches.findLast((match) => match.table === table)

  return lastPlayed === undefined
    ? { match: null, phase: 'idle', table }
    : { match: lastPlayed, phase: 'finished', table }
}

export const displayBoardFor = (
  snapshot: PublicSnapshot,
  tables: readonly TableNumber[]
): DisplayBoard => {
  const tiles = tables.map((table) => tileFor(snapshot, table))

  return {
    live: tiles.filter((tile) => tile.phase === 'live'),
    quiet: tiles.filter((tile) => tile.phase !== 'live')
  }
}
