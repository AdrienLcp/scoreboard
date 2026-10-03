import type { MatchId, TableNumber } from '@scoreboard/protocol/identifiers'
import type { MatchStatus } from '@scoreboard/protocol/match-state'

type QueuedMatch = {
  id: MatchId
  status: MatchStatus
  table: TableNumber | null
}

/**
 * The match a table is on: the one being played there, or else the next one
 * scheduled there in setup order. `null` once the table has nothing left.
 */
export const matchOnTable = (
  matches: readonly QueuedMatch[],
  table: TableNumber
): MatchId | null => {
  const onTable = matches.filter((match) => match.table === table)
  const live = onTable.find((match) => match.status === 'live')
  const next = onTable.find((match) => match.status === 'scheduled')

  return live?.id ?? next?.id ?? null
}

export const tableNumbers = (tableCount: number): TableNumber[] =>
  Array.from({ length: tableCount }, (_, index) => index + 1)
