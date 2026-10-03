import type { MatchFormat } from '@scoreboard/protocol/match-format'

import { typicalMatchDurationMs } from '../match/match-log'

/** A match played to its end at this event: how it was played and how long it took. */
export type PlayedMatch = {
  durationMs: number
  format: MatchFormat
}

/** The estimate follows the room's pace without one marathon match dragging it for the whole day. */
const ROLLING_WINDOW = 8

const formatKey = (format: MatchFormat): string =>
  JSON.stringify(
    Object.entries(format).toSorted(([left], [right]) =>
      left.localeCompare(right)
    )
  )

/**
 * How long the next match of `format` should take: the average of the last
 * matches of that format played here, or the ruleset's typical length until
 * there are some. `played` is in the order the matches finished.
 */
export const estimatedDurationMs = ({
  format,
  played
}: {
  format: MatchFormat
  played: readonly PlayedMatch[]
}): number => {
  const recent = played
    .filter((match) => formatKey(match.format) === formatKey(format))
    .slice(-ROLLING_WINDOW)

  if (recent.length === 0) {
    return typicalMatchDurationMs(format)
  }

  return Math.round(
    recent.reduce((total, match) => total + match.durationMs, 0) / recent.length
  )
}
