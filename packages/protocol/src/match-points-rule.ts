import { z } from 'zod'

/**
 * How an encounter's score counts its matches. It belongs to the competition,
 * not to the sheet: the departmental championship counts one point per match
 * won (the signed departmental D2 sheet reads 11–9), some days count two for a win
 * and one for a loss played out.
 */
export const matchPointsRuleIds = ['one-per-win', 'two-per-win'] as const
export const matchPointsRuleIdSchema = z.enum(matchPointsRuleIds)
export type MatchPointsRuleId = z.infer<typeof matchPointsRuleIdSchema>

export const DEFAULT_MATCH_POINTS_RULE: MatchPointsRuleId = 'one-per-win'
