import type { MatchPointsRuleId } from '@scoreboard/protocol/match-points-rule'

import type { MatchPoints } from './encounter-format'

export const MATCH_POINTS_RULES = {
  /** FFTT team championship: the encounter score is the number of matches won. */
  'one-per-win': { loss: 0, retirement: 0, walkover: 0, win: 1 },
  /** 2 points for a win, 1 for a loss played out or abandoned, 0 for a match not played. */
  'two-per-win': { loss: 1, retirement: 1, walkover: 0, win: 2 }
} as const satisfies Record<MatchPointsRuleId, MatchPoints>

export const matchPointsFor = (rule: MatchPointsRuleId): MatchPoints =>
  MATCH_POINTS_RULES[rule]
