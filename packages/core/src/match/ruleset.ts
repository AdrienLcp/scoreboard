import type { Result } from '@adrienlcp/result'

import type { MatchFormat } from '@scoreboard/protocol/match-format'
import type { MatchState } from '@scoreboard/protocol/match-state'
import type { Score, Side } from '@scoreboard/protocol/side'

/**
 * A ruleset's answer to a move: the progress it leads to, or why it refuses.
 * The progress is wrapped so the success arm stays known while `TProgress` is
 * still generic.
 */
export type Ruling<TProgress, TRefusal> = Result<
  { progress: TProgress },
  TRefusal
>

/** What a sport's rules say about a match in progress; the engine adds status, undo and concessions. */
export type RulesetView = Omit<MatchState, 'canUndo' | 'concession' | 'status'>

/**
 * A sport's scoring rules, as a fold over a match's events. `TProgress` is
 * whatever the sport needs to remember — games and the first server for table
 * tennis, halves and a clock for football — and nothing outside the ruleset
 * reads it. A sport plugs in by implementing this contract and adding its
 * format to `matchFormatSchema`; the engine in `match-log.ts` stays as is.
 */
export type Ruleset<TFormat extends MatchFormat, TProgress> = {
  /** One more point, goal or rally for `side`. */
  award: (progress: TProgress, side: Side) => Ruling<TProgress, 'match_over'>
  begin: (input: { firstServer: Side; format: TFormat }) => TProgress
  /** The organiser's rewrite of the score, every period so far. */
  correct: (
    progress: TProgress,
    periods: readonly Score[]
  ) => Ruling<TProgress, 'invalid_score'>
  /** Closing a match by hand: a sport whose score decides on its own refuses. */
  end: (progress: TProgress) => Ruling<TProgress, 'cannot_end'>
  view: (progress: TProgress) => RulesetView
}
