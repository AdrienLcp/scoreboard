import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { TableNumber } from '@scoreboard/protocol/identifiers'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'

/** How long a finished match keeps its tile, so the room sees the final score. */
export const LINGER_MS = 4_000

export type StageTile = {
  /** `true` while a match that just ended keeps its tile. */
  isOver: boolean
  match: MatchView
  table: TableNumber
}

const lastFinishedOn = (
  snapshot: PublicSnapshot,
  table: TableNumber
): MatchView | null =>
  snapshot.matches
    .filter(
      (match) =>
        match.table === table &&
        match.state.status === 'finished' &&
        match.timing.finishedAtMs !== null
    )
    .toSorted(
      (left, right) =>
        (right.timing.finishedAtMs ?? 0) - (left.timing.finishedAtMs ?? 0)
    )[0] ?? null

export const isLingering = (match: MatchView, nowMs: InstantMs): boolean =>
  match.timing.finishedAtMs !== null &&
  nowMs - match.timing.finishedAtMs < LINGER_MS

/**
 * The tables that own the screen, in table order: those playing, and those
 * whose match ended moments ago, until the room has read the final score.
 */
export const stageTilesFor = ({
  nowMs,
  snapshot,
  tables
}: {
  nowMs: InstantMs
  snapshot: PublicSnapshot
  tables: readonly TableNumber[]
}): StageTile[] =>
  tables.flatMap((table): StageTile[] => {
    const currentId = snapshot.tables.find(
      (view) => view.number === table
    )?.matchId
    const current = snapshot.matches.find((match) => match.id === currentId)

    if (current?.state.status === 'live') {
      return [{ isOver: false, match: current, table }]
    }

    const finished = lastFinishedOn(snapshot, table)

    return finished !== null && isLingering(finished, nowMs)
      ? [{ isOver: true, match: finished, table }]
      : []
  })
