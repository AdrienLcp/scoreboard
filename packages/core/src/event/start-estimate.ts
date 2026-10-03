import type { MatchId, TableNumber } from '@scoreboard/protocol/identifiers'
import type { MatchFormat } from '@scoreboard/protocol/match-format'
import type { MatchStatus } from '@scoreboard/protocol/match-state'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'

export type QueuedMatch = {
  format: MatchFormat
  id: MatchId
  plannedAtMs: InstantMs | null
  startedAtMs: InstantMs | null
  status: MatchStatus
  table: TableNumber | null
}

/**
 * When each match still to come on a table should start. A table is free once
 * its live match has run its expected length, then plays its queue in setup
 * order, each match lasting its expected length; a match never starts before
 * its planned time, the event's start, or now. A match with no table has no
 * estimate.
 */
export const estimatedStartsFor = ({
  durationFor,
  matches,
  nowMs,
  startsAtMs
}: {
  durationFor: (format: MatchFormat) => number
  matches: readonly QueuedMatch[]
  nowMs: InstantMs
  startsAtMs: InstantMs | null
}): Map<MatchId, InstantMs> => {
  const estimates = new Map<MatchId, InstantMs>()
  const tables = new Set(
    matches.flatMap((match) => (match.table === null ? [] : [match.table]))
  )

  for (const table of tables) {
    const onTable = matches.filter((match) => match.table === table)
    const live = onTable.find((match) => match.status === 'live')
    const liveEndsAtMs =
      live === undefined || live.startedAtMs === null
        ? nowMs
        : live.startedAtMs + durationFor(live.format)
    let freeAtMs = Math.max(nowMs, startsAtMs ?? nowMs, liveEndsAtMs)

    for (const match of onTable.filter(
      ({ status }) => status === 'scheduled'
    )) {
      const startMs = Math.max(freeAtMs, match.plannedAtMs ?? freeAtMs)

      estimates.set(match.id, startMs)
      freeAtMs = startMs + durationFor(match.format)
    }
  }

  return estimates
}
