import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { TableNumber } from '@scoreboard/protocol/identifiers'

const lastMatchOn = (
  matches: readonly MatchView[],
  table: TableNumber
): MatchView | null =>
  matches.filter((match) => match.table === table).at(-1) ?? null

/** The match a table is on: the one played or awaited there, else the last it played. */
export const currentMatchOn = (
  snapshot: PublicSnapshot,
  table: TableNumber
): MatchView | null => {
  const currentId = snapshot.tables.find(
    (view) => view.number === table
  )?.matchId

  return (
    snapshot.matches.find((match) => match.id === currentId) ??
    lastMatchOn(snapshot.matches, table)
  )
}
