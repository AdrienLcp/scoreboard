import type { EncounterOutcome } from '@scoreboard/protocol/event-snapshot'
import type { MatchState } from '@scoreboard/protocol/match-state'
import type { Score, Side } from '@scoreboard/protocol/side'

import type { EncounterFormat, MatchPoints } from './encounter-format'

const loserPointsFor = (state: MatchState, points: MatchPoints): number => {
  switch (state.concession?.reason) {
    case 'retirement':
      return points.retirement
    case 'walkover':
      return points.walkover
    case undefined:
      return points.loss
  }
}

const pointsEarned = ({
  points,
  side,
  state
}: {
  points: MatchPoints
  side: Side
  state: MatchState
}): number => {
  if (state.winner === null) {
    return 0
  }

  return state.winner === side ? points.win : loserPointsFor(state, points)
}

/**
 * The encounter's running score, summed match by match as its sheet counts
 * them. The outcome is known once every match of the sheet is over.
 */
export const scoreEncounter = ({
  format,
  states
}: {
  format: EncounterFormat
  states: readonly MatchState[]
}): { outcome: EncounterOutcome | null; points: Score } => {
  const pointsFor = (side: Side): number =>
    states.reduce(
      (total, state) =>
        total + pointsEarned({ points: format.matchPoints, side, state }),
      0
    )
  const points = { away: pointsFor('away'), home: pointsFor('home') }

  const isSheetComplete =
    states.length === format.sheet.length &&
    states.every((state) => state.status === 'finished')

  if (!isSheetComplete) {
    return { outcome: null, points }
  }

  if (points.home === points.away) {
    return { outcome: 'draw', points }
  }

  return { outcome: points.home > points.away ? 'home' : 'away', points }
}
