import { Result } from '@adrienlcp/result'

import type { RecordRefusal } from '@scoreboard/protocol/error-code'
import type { MatchFormat } from '@scoreboard/protocol/match-format'
import {
  type Concession,
  type MatchCard,
  type MatchState,
  scheduledMatchState,
  type TimeoutsTaken
} from '@scoreboard/protocol/match-state'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'

import { tableTennisRuleset } from '../table-tennis/table-tennis-ruleset'
import { opponentOf } from './opponent'
import type { Ruleset } from './ruleset'

type Standing<TProgress> = {
  cards: readonly MatchCard[]
  concession: Concession | null
  isEnded: boolean
  progress: TProgress
  timeouts: TimeoutsTaken
}

const NO_TIMEOUTS: TimeoutsTaken = { away: false, home: false }

const freshStanding = <TProgress>(
  progress: TProgress
): Standing<TProgress> => ({
  cards: [],
  concession: null,
  isEnded: false,
  progress,
  timeouts: NO_TIMEOUTS
})

/**
 * Where the match stands after the events so far. `undoStack` holds the
 * standing before each event an undo may cancel, most recent last: undoing is
 * popping.
 */
type Position<TProgress> = {
  standing: Standing<TProgress> | null
  undoStack: readonly (Standing<TProgress> | null)[]
}

/** The match folded so far, with the ids it accepted: a resent event is one of them. */
type Folded<TProgress> = Position<TProgress> & {
  seenIds: ReadonlySet<string>
}

const NOT_STARTED: Position<never> = { standing: null, undoStack: [] }

type ProgressingEvent = Exclude<
  ScoringEvent,
  { type: 'match.started' | 'score.undone' }
>

type CardShown = Extract<ScoringEvent, { type: 'card.shown' }>

/**
 * The card joins the match, then its penalty goes to the opponent point by
 * point. A penalty point that wins the game drops the rest: the won game
 * waits for the umpire like any other.
 */
const showCard = <TFormat extends MatchFormat, TProgress>(
  ruleset: Ruleset<TFormat, TProgress>,
  standing: Standing<TProgress>,
  card: CardShown
): Standing<TProgress> => {
  const beneficiary = opponentOf(card.side)
  let { progress } = standing

  for (let point = 0; point < card.penalty; point += 1) {
    const awarded = ruleset.award(progress, beneficiary)

    if (awarded.status === 'failure') {
      break
    }

    progress = awarded.data.progress
  }

  return {
    ...standing,
    cards: [
      ...standing.cards,
      {
        id: card.id,
        penalty: card.penalty,
        playerId: card.playerId,
        side: card.side
      }
    ],
    progress
  }
}

/** Takes back a mis-tap at any time, even once the match is over. */
const withdraw = <TProgress>(
  standing: Standing<TProgress>,
  event: Extract<ScoringEvent, { type: 'card.withdrawn' | 'timeout.withdrawn' }>
): Result<Standing<TProgress>, RecordRefusal> => {
  if (event.type === 'timeout.withdrawn') {
    return standing.timeouts[event.side]
      ? Result.success({
          ...standing,
          timeouts: { ...standing.timeouts, [event.side]: false }
        })
      : Result.failure('no_timeout_to_withdraw')
  }

  const cards = standing.cards.filter((card) => card.id !== event.cardId)

  return cards.length === standing.cards.length
    ? Result.failure('card_not_found')
    : Result.success({ ...standing, cards })
}

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

  if (event.type === 'card.withdrawn' || event.type === 'timeout.withdrawn') {
    return withdraw(standing, event)
  }

  if (isOver(ruleset, standing)) {
    return Result.failure('match_over')
  }

  switch (event.type) {
    case 'period.confirmed': {
      const confirmed = ruleset.confirm(standing.progress)

      return confirmed.status === 'failure'
        ? confirmed
        : Result.success({ ...standing, progress: confirmed.data.progress })
    }
    case 'timeout.called':
      return standing.timeouts[event.side]
        ? Result.failure('timeout_already_taken')
        : Result.success({
            ...standing,
            timeouts: { ...standing.timeouts, [event.side]: true }
          })
    case 'card.shown':
      return Result.success(showCard(ruleset, standing, event))
    case 'point.scored': {
      const awarded = ruleset.award(standing.progress, event.side)

      return awarded.status === 'failure'
        ? awarded
        : Result.success({ ...standing, progress: awarded.data.progress })
    }
    case 'match.conceded':
      return Result.success({
        ...standing,
        concession: { by: event.by, reason: event.reason },
        progress:
          event.reason === 'walkover'
            ? ruleset.walkover(standing.progress, opponentOf(event.by))
            : standing.progress
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
  position: Position<TProgress>,
  event: ScoringEvent
): Result<Position<TProgress>, RecordRefusal> => {
  const { standing } = position

  if (event.type === 'match.started') {
    if (standing !== null) {
      return Result.failure('already_started')
    }

    return Result.success({
      standing: freshStanding(
        ruleset.begin({ firstServer: event.firstServer, format })
      ),
      undoStack: []
    })
  }

  // A walkover is conceded before the match ever starts. Who would have served
  // is moot: the match is over the moment it is recorded.
  if (standing === null && event.type === 'match.conceded') {
    return Result.success({
      standing: {
        ...freshStanding(
          ruleset.walkover(
            ruleset.begin({ firstServer: event.by, format }),
            opponentOf(event.by)
          )
        ),
        concession: { by: event.by, reason: event.reason }
      },
      undoStack: [null]
    })
  }

  if (standing === null) {
    return Result.failure('not_started')
  }

  if (event.type === 'score.undone') {
    const previous = position.undoStack.at(-1)

    if (previous === undefined) {
      return Result.failure('nothing_to_undo')
    }

    return Result.success({
      standing: previous,
      undoStack: position.undoStack.slice(0, -1)
    })
  }

  const next = advance(ruleset, standing, event)

  if (next.status === 'failure') {
    return next
  }

  return Result.success({
    standing: next.data,
    undoStack: [...position.undoStack, standing]
  })
}

/**
 * Replays a stored log. An event the rules refuse is skipped: the log only
 * ever holds accepted ones. One set of ids grows through the whole replay,
 * where a copy per event made every replay quadratic in the log's length.
 */
const fold = <TFormat extends MatchFormat, TProgress>(
  ruleset: Ruleset<TFormat, TProgress>,
  format: TFormat,
  log: readonly ScoringEvent[]
): Folded<TProgress> => {
  const seenIds = new Set<string>()
  const position = log.reduce<Position<TProgress>>((reached, event) => {
    if (seenIds.has(event.id)) {
      return reached
    }

    const stepped = step(ruleset, format, reached, event)

    if (stepped.status === 'failure') {
      return reached
    }

    seenIds.add(event.id)

    return stepped.data
  }, NOT_STARTED)

  return { ...position, seenIds }
}

const stateOf = <TFormat extends MatchFormat, TProgress>(
  ruleset: Ruleset<TFormat, TProgress>,
  folded: Folded<TProgress>
): MatchState => {
  const { standing } = folded

  if (standing === null) {
    return scheduledMatchState
  }

  const view = ruleset.view(standing.progress)
  const canUndo = folded.undoStack.length > 0
  const { cards, timeouts } = standing

  if (standing.concession !== null) {
    return {
      ...view,
      awaiting: null,
      canUndo,
      cards: [...cards],
      concession: standing.concession,
      current: standing.concession.reason === 'walkover' ? null : view.current,
      serveTurn: null,
      serving: null,
      stake: null,
      status: 'finished',
      timeouts,
      winner: opponentOf(standing.concession.by)
    }
  }

  const isFinished = standing.isEnded || view.winner !== null

  return {
    ...view,
    awaiting: isFinished ? null : view.awaiting,
    canUndo,
    cards: [...cards],
    concession: null,
    serveTurn: isFinished ? null : view.serveTurn,
    serving: isFinished ? null : view.serving,
    stake: isFinished ? null : view.stake,
    status: isFinished ? 'finished' : 'live',
    timeouts
  }
}

/**
 * A match folded one event at a time, for a caller that appends to a log it
 * keeps: each event costs one step, never a replay of the log so far.
 */
export type MatchReplay = {
  /** The state every screen shows after the events so far. */
  state: MatchState
  /** The replay one event on; an event the rules refuse is skipped, as in a stored log. */
  with: (event: ScoringEvent) => MatchReplay
}

type MatchRules = {
  typicalDurationMs: () => number
  describe: (log: readonly ScoringEvent[]) => MatchState
  replay: (log: readonly ScoringEvent[]) => MatchReplay
  record: (
    log: readonly ScoringEvent[],
    event: ScoringEvent
  ) => Result<ScoringEvent[], RecordRefusal | 'duplicate'>
}

const rulesWith = <TFormat extends MatchFormat, TProgress>(
  ruleset: Ruleset<TFormat, TProgress>,
  format: TFormat
): MatchRules => {
  const replayFrom = (folded: Folded<TProgress>): MatchReplay => {
    const replay: MatchReplay = {
      state: stateOf(ruleset, folded),
      with: (event) => {
        if (folded.seenIds.has(event.id)) {
          return replay
        }

        const stepped = step(ruleset, format, folded, event)

        return stepped.status === 'failure'
          ? replay
          : replayFrom({
              ...stepped.data,
              seenIds: new Set([...folded.seenIds, event.id])
            })
      }
    }

    return replay
  }

  return {
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
    },
    replay: (log) => replayFrom(fold(ruleset, format, log)),
    typicalDurationMs: () => ruleset.typicalDurationMs(format)
  }
}

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

/** The match after `log`, ready to take its next events one at a time. */
export const replayMatch = (
  format: MatchFormat,
  log: readonly ScoringEvent[] = []
): MatchReplay => rulesFor(format).replay(log)

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

/** How long a match of `format` usually lasts, by its sport's ruleset. */
export const typicalMatchDurationMs = (format: MatchFormat): number =>
  rulesFor(format).typicalDurationMs()
