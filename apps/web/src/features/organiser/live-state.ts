import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { TableNumber } from '@scoreboard/protocol/identifiers'
import type { Side } from '@scoreboard/protocol/side'

import { opponentOf } from '@scoreboard/core/match/opponent'

import { matchCallOf } from '@/features/event/match-call'
import { currentMatchOn } from '@/features/event/table-match'

/** The one word a live table wears: a won game or match awaiting validation, or a level score at the end of a game. */
export type LivePillKind = 'match-won' | 'game-won' | 'deuce'

/** What a table of the live plan shows: nothing, the match it waits for, or the match on it. */
export type LiveTableState =
  | { kind: 'free' }
  | { kind: 'next'; match: MatchView }
  | {
      /** The side that lost the game or match awaiting validation, dimmed until the umpire confirms. */
      dimmed: Side | null
      kind: 'live'
      match: MatchView
      pill: LivePillKind | null
    }

export const livePillOf = (match: MatchView): LivePillKind | null => {
  const { awaiting } = match.state

  if (awaiting !== null) {
    return awaiting.decides === 'match' ? 'match-won' : 'game-won'
  }

  return matchCallOf(match)?.kind === 'deuce' ? 'deuce' : null
}

export const liveTableStateOf = (
  event: PublicSnapshot,
  table: TableNumber
): LiveTableState => {
  const match = currentMatchOn(event, table)

  if (match === null || match.state.status === 'finished') {
    return { kind: 'free' }
  }

  if (match.state.status === 'scheduled') {
    return { kind: 'next', match }
  }

  const { awaiting } = match.state

  return {
    dimmed: awaiting === null ? null : opponentOf(awaiting.side),
    kind: 'live',
    match,
    pill: livePillOf(match)
  }
}

/** Nothing has started while every match still waits for its first point. */
export const hasPlayBegun = (event: PublicSnapshot): boolean =>
  event.matches.some((match) => match.state.status !== 'scheduled')

/** The matches not over that no table holds: moved off theirs, or never given one. */
export const matchesWithoutTableOf = (event: PublicSnapshot): MatchView[] =>
  event.matches.filter(
    (match) => match.table === null && match.state.status !== 'finished'
  )
