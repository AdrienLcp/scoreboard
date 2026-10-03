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
 * The points of a match, latest first, each with the score it left. An undo
 * strikes the latest point still standing, the one the ruleset cancelled.
 */
export const pointHistoryOf = (
  format: MatchFormat,
  events: readonly ScoringEvent[]
): ScoredPoint[] => {
  const points: ScoredPoint[] = []

  events.forEach((event, position) => {
    if (event.type === 'point.scored') {
      points.push({
        id: event.id,
        isUndone: false,
        scoreAfter: describeMatch(format, events.slice(0, position + 1))
          .current,
        side: event.side
      })
    }

    if (event.type === 'score.undone') {
      const standing = points.findLastIndex((point) => !point.isUndone)
      const undone = points[standing]

      if (undone !== undefined) {
        points[standing] = { ...undone, isUndone: true }
      }
    }
  })

  return points.toReversed()
}

/** The side whose point an undo would take back, if the last thing standing is a point. */
export const lastPointSideOf = (history: readonly ScoredPoint[]): Side | null =>
  history.find((point) => !point.isUndone)?.side ?? null
