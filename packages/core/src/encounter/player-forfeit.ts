import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { MatchId, PlayerId } from '@scoreboard/protocol/identifiers'
import type { Side } from '@scoreboard/protocol/side'

import { sheetLettersOf } from './encounter-sheet'

/** A match the absent player's side gives up, unplayed. */
export type ForfeitedMatch = { by: Side; matchId: MatchId }

/**
 * Who does not come to the table: a named player, or a letter of the sheet
 * nobody holds, the seat of a player away for the whole day.
 */
export type ForfeitSeat =
  | { kind: 'player'; playerId: PlayerId }
  | { kind: 'letter'; letter: string; side: Side }

/** What the forfeit reads of a match: who plays it, and whether it began or was given up. */
type ForfeitableMatch = Pick<MatchView, 'away' | 'home' | 'id' | 'label'> & {
  state: Pick<MatchView['state'], 'canUndo' | 'concession' | 'status'>
}

const SIDES: readonly Side[] = ['home', 'away']

const sideOf = (match: ForfeitableMatch, seat: ForfeitSeat): Side | null => {
  if (seat.kind === 'player') {
    return (
      SIDES.find((side) => match[side].playerIds.includes(seat.playerId)) ??
      null
    )
  }

  const letters = sheetLettersOf(match.label)

  return letters?.[seat.side] === seat.letter &&
    match[seat.side].playerIds.length === 0
    ? seat.side
    : null
}

/**
 * Whoever does not come to the table loses every match of the encounter still
 * waiting for him, by walkover: there are no substitutes in a team
 * championship. A match already under way ends through its own concession.
 */
export const forfeitedMatchesOf = ({
  matches,
  seat
}: {
  matches: readonly ForfeitableMatch[]
  seat: ForfeitSeat
}): ForfeitedMatch[] =>
  matches.flatMap((match) => {
    const by = sideOf(match, seat)

    return by === null || match.state.status !== 'scheduled'
      ? []
      : [{ by, matchId: match.id }]
  })

/**
 * The walkovers a seat's side gave and can still take back: undoing each one
 * puts its match back on the sheet, so a forfeit declared by mistake goes
 * away in one gesture.
 */
export const walkoversOf = ({
  matches,
  seat
}: {
  matches: readonly ForfeitableMatch[]
  seat: ForfeitSeat
}): MatchId[] =>
  matches.flatMap((match) => {
    const { canUndo, concession } = match.state

    return concession?.reason === 'walkover' &&
      canUndo &&
      sideOf(match, seat) === concession.by
      ? [match.id]
      : []
  })

/** The letters of a side the sheet still has nobody on, in a singles. */
export const vacantLettersOf = ({
  matches,
  side
}: {
  matches: readonly ForfeitableMatch[]
  side: Side
}): string[] => [
  ...new Set(
    matches.flatMap((match) => {
      const letter = sheetLettersOf(match.label)?.[side]

      return letter === undefined || match[side].playerIds.length > 0
        ? []
        : [letter]
    })
  )
]
