import type { MatchFormat } from '@scoreboard/protocol/match-format'
import type { MatchState } from '@scoreboard/protocol/match-state'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'
import type { Score, Side } from '@scoreboard/protocol/side'

import {
  describeMatch,
  recordScoringEvent
} from '@scoreboard/core/match/match-log'

/** Where one game of a score being corrected stands, as the sport's rules read it. */
export type DraftGame =
  | { kind: 'won'; side: Side }
  | { kind: 'playing' }
  | { kind: 'impossible' }

/** Ids of a correction tried out on the device, never sent. */
const DRAFT_START_ID = '00000000-0000-4000-8000-000000000001'
const DRAFT_CORRECTION_ID = '00000000-0000-4000-8000-000000000002'

const DRAFT_START: ScoringEvent = {
  firstServer: 'home',
  id: DRAFT_START_ID,
  type: 'match.started'
}

/** The match the rules would make of `periods`, or `null` when they refuse it. */
const correctedStateOf = (
  format: MatchFormat,
  periods: readonly Score[]
): MatchState | null => {
  const recorded = recordScoringEvent({
    event: {
      id: DRAFT_CORRECTION_ID,
      periods: [...periods],
      type: 'score.corrected'
    },
    format,
    log: [DRAFT_START]
  })

  return recorded.status === 'success'
    ? describeMatch(format, recorded.data)
    : null
}

/** Whether the server will take `periods` as the match's score. */
export const isDraftAccepted = (
  format: MatchFormat,
  periods: readonly Score[]
): boolean => correctedStateOf(format, periods) !== null

/** One game read on its own: won by a side, still on, or a score no game reaches. */
const gameAloneOf = (format: MatchFormat, period: Score): DraftGame => {
  const state = correctedStateOf(format, [period])

  if (state === null) {
    return { kind: 'impossible' }
  }

  return state.periods.length === 1
    ? { kind: 'won', side: period.home > period.away ? 'home' : 'away' }
    : { kind: 'playing' }
}

/**
 * Each game of a score being corrected: won by a side, still being played, or
 * impossible where it stands (a score no game reaches, a game left unfinished
 * before the last, a game after the match was won), so the organiser sees
 * which game to fix and only that one.
 */
export const draftGamesOf = (
  format: MatchFormat,
  periods: readonly Score[]
): DraftGame[] =>
  periods.map((period, index) => {
    const alone = gameAloneOf(format, period)
    const isLast = index === periods.length - 1
    const before = correctedStateOf(format, periods.slice(0, index))
    const isDecidedBefore = before !== null && before.winner !== null

    return isDecidedBefore || (alone.kind === 'playing' && !isLast)
      ? { kind: 'impossible' }
      : alone
  })
