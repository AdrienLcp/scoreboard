import type { MatchFormat } from '@scoreboard/protocol/match-format'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'
import type { Score, Side } from '@scoreboard/protocol/side'

import { describeMatch } from '@scoreboard/core/match/match-log'

/** One point in the umpire's recent list, struck through once undone. */
export type ScoredPoint = {
  id: string
  isUndone: boolean
  /** The score of the game right after it; `null` when it closed the match. */
  scoreAfter: Score | null
  side: Side
}

/**
 * The events an undo may take back, oldest first: every one but the start and
 * the undos themselves, each undo popping the latest still standing.
 */
const standingEventsOf = (events: readonly ScoringEvent[]): ScoringEvent[] => {
  const standing: ScoringEvent[] = []

  for (const event of events) {
    if (event.type === 'score.undone') {
      standing.pop()
    } else if (event.type !== 'match.started') {
      standing.push(event)
    }
  }

  return standing
}

/**
 * The points of a match, latest first, each with the score it left. A point
 * an undo took back is struck through; an undo that took back a validation,
 * a card or a time-out strikes no point.
 */
export const pointHistoryOf = (
  format: MatchFormat,
  events: readonly ScoringEvent[]
): ScoredPoint[] => {
  const standingIds = new Set(standingEventsOf(events).map((event) => event.id))

  return events
    .flatMap((event, position) =>
      event.type === 'point.scored'
        ? [
            {
              id: event.id,
              isUndone: !standingIds.has(event.id),
              scoreAfter: describeMatch(format, events.slice(0, position + 1))
                .current,
              side: event.side
            }
          ]
        : []
    )
    .toReversed()
}

/** The side whose point an undo would take back, if the last thing standing is a point. */
export const undoTargetSideOf = (
  events: readonly ScoringEvent[]
): Side | null => {
  const last = standingEventsOf(events).at(-1)

  return last?.type === 'point.scored' ? last.side : null
}
