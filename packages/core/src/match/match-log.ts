import { Result } from '@adrienlcp/result'

import type { RecordRefusal } from '@scoreboard/protocol/error-code'
import type { MatchFormat } from '@scoreboard/protocol/match-format'
import type { Concession, MatchState } from '@scoreboard/protocol/match-state'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'

import { tableTennisRuleset } from '../table-tennis/table-tennis-ruleset'
import { opponentOf } from './opponent'
import type { Ruleset } from './ruleset'

type Standing<TProgress> = {
  concession: Concession | null
  isEnded: boolean
  progress: TProgress
}

/**
 * The match folded so far. `undoStack` holds the standing before each event an
 * undo may cancel, most recent last: undoing is popping.
 */
type Folded<TProgress> = {
  seenIds: ReadonlySet<string>
  standing: Standing<TProgress> | null
  undoStack: readonly (Standing<TProgress> | null)[]
}

type ProgressingEvent = Exclude<
  ScoringEvent,
  { type: 'match.started' | 'score.undone' }
>

const isOver = <TFormat extends MatchFormat, TProgress>(
  ruleset: Ruleset<TFormat, TProgress>,
  standing: Standing<TProgress>
): boolean =>
  standing.concession !== null ||
  standing.isEnded ||
  ruleset.view(standing.progress).winner !== null

const advance = <TFormat extends MatchFormat, TProgress>(
  ruleset: Ruleset<TFormat, TProgress>,
  standing: Standing<TProgress>,
  event: ProgressingEvent
): Result<Standing<TProgress>, RecordRefusal> => {
  if (event.type === 'score.corrected') {
    const corrected = ruleset.correct(standing.progress, event.periods)

    return corrected.status === 'failure'
      ? corrected
      : Result.success({ ...standing, progress: corrected.data.progress })
  }

  if (isOver(ruleset, standing)) {
    return Result.failure('match_over')
  }

  switch (event.type) {
    case 'point.scored': {
      const awarded = ruleset.award(standing.progress, event.side)

      return awarded.status === 'failure'
        ? awarded
        : Result.success({ ...standing, progress: awarded.data.progress })
    }
    case 'match.conceded':
      return Result.success({
        ...standing,
        concession: { by: event.by, reason: event.reason }
      })
    case 'match.ended': {
      const ended = ruleset.end(standing.progress)

      return ended.status === 'failure'
        ? ended
        : Result.success({
            ...standing,
            isEnded: true,
            progress: ended.data.progress
          })
    }
  }
}

const step = <TFormat extends MatchFormat, TProgress>(
  ruleset: Ruleset<TFormat, TProgress>,
  format: TFormat,
  folded: Folded<TProgress>,
  event: ScoringEvent
): Result<Folded<TProgress>, RecordRefusal> => {
  const seenIds = new Set([...folded.seenIds, event.id])
  const { standing } = folded

  if (event.type === 'match.started') {
    if (standing !== null) {
      return Result.failure('already_started')
    }

    return Result.success({
      seenIds,
      standing: {
        concession: null,
        isEnded: false,
        progress: ruleset.begin({ firstServer: event.firstServer, format })
      },
      undoStack: []
    })
  }

  // A walkover is conceded before the match ever starts. Who would have served
  // is moot: the match is over the moment it is recorded.
  if (standing === null && event.type === 'match.conceded') {
    return Result.success({
      seenIds,
      standing: {
        concession: { by: event.by, reason: event.reason },
        isEnded: false,
        progress: ruleset.begin({ firstServer: event.by, format })
      },
      undoStack: [null]
    })
  }

  if (standing === null) {
    return Result.failure('not_started')
  }

  if (event.type === 'score.undone') {
    const previous = folded.undoStack.at(-1)

    if (previous === undefined) {
      return Result.failure('nothing_to_undo')
    }

    return Result.success({
      seenIds,
      standing: previous,
      undoStack: folded.undoStack.slice(0, -1)
    })
  }

  const next = advance(ruleset, standing, event)

  if (next.status === 'failure') {
    return next
  }

  return Result.success({
    seenIds,
    standing: next.data,
    undoStack: [...folded.undoStack, standing]
  })
}

/** Replays a stored log. An event the rules refuse is skipped: the log only ever holds accepted ones. */
const fold = <TFormat extends MatchFormat, TProgress>(
  ruleset: Ruleset<TFormat, TProgress>,
  format: TFormat,
  log: readonly ScoringEvent[]
): Folded<TProgress> =>
  log.reduce<Folded<TProgress>>(
    (folded, event) => {
      if (folded.seenIds.has(event.id)) {
        return folded
      }

      const stepped = step(ruleset, format, folded, event)

      return stepped.status === 'success' ? stepped.data : folded
    },
    { seenIds: new Set(), standing: null, undoStack: [] }
  )

const SCHEDULED: MatchState = {
  canUndo: false,
  concession: null,
  current: null,
  endsSwapped: false,
  periods: [],
  periodsWon: { away: 0, home: 0 },
  serving: null,
  stake: null,
  status: 'scheduled',
  winner: null
}

const stateOf = <TFormat extends MatchFormat, TProgress>(
  ruleset: Ruleset<TFormat, TProgress>,
  folded: Folded<TProgress>
): MatchState => {
  const { standing } = folded

  if (standing === null) {
    return SCHEDULED
  }

  const view = ruleset.view(standing.progress)
  const canUndo = folded.undoStack.length > 0

  if (standing.concession !== null) {
    return {
      ...view,
      canUndo,
      concession: standing.concession,
      current: standing.concession.reason === 'walkover' ? null : view.current,
      serving: null,
      stake: null,
      status: 'finished',
      winner: opponentOf(standing.concession.by)
    }
  }

  const isFinished = standing.isEnded || view.winner !== null

  return {
    ...view,
    canUndo,
    concession: null,
    serving: isFinished ? null : view.serving,
    stake: isFinished ? null : view.stake,
    status: isFinished ? 'finished' : 'live'
  }
}

type MatchRules = {
  describe: (log: readonly ScoringEvent[]) => MatchState
  record: (
    log: readonly ScoringEvent[],
    event: ScoringEvent
  ) => Result<ScoringEvent[], RecordRefusal | 'duplicate'>
}

const rulesWith = <TFormat extends MatchFormat, TProgress>(
  ruleset: Ruleset<TFormat, TProgress>,
  format: TFormat
): MatchRules => ({
  describe: (log) => stateOf(ruleset, fold(ruleset, format, log)),
  record: (log, event) => {
    const folded = fold(ruleset, format, log)

    if (folded.seenIds.has(event.id)) {
      return Result.failure('duplicate')
    }

    const stepped = step(ruleset, format, folded, event)

    return stepped.status === 'failure'
      ? stepped
      : Result.success([...log, event])
  }
})

/** The one place a format meets its sport's ruleset. */
const rulesFor = (format: MatchFormat): MatchRules => {
  switch (format.sport) {
    case 'table-tennis':
      return rulesWith(tableTennisRuleset, format)
  }
}

/** The state every screen shows, derived from the match's log. */
export const describeMatch = (
  format: MatchFormat,
  log: readonly ScoringEvent[]
): MatchState => rulesFor(format).describe(log)

/**
 * Appends `event` to the log when the rules accept it. `duplicate` is an event
 * already in the log, resent by a device that never heard it was recorded.
 */
export const recordScoringEvent = ({
  event,
  format,
  log
}: {
  event: ScoringEvent
  format: MatchFormat
  log: readonly ScoringEvent[]
}): Result<ScoringEvent[], RecordRefusal | 'duplicate'> =>
  rulesFor(format).record(log, event)
