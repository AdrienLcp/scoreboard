import type { Player } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { PlayerId } from '@scoreboard/protocol/identifiers'
import type { CardPenalty } from '@scoreboard/protocol/scoring-event'
import { type Side, sides } from '@scoreboard/protocol/side'

import { singlesLettersOf } from './sheet-call'

/** Each player's letter on the sheet, read from the singles he plays in the encounter. */
const lettersByPlayer = (
  matches: readonly MatchView[]
): Map<PlayerId, string> => {
  const letters = new Map<PlayerId, string>()

  for (const match of matches) {
    const lineLetters = singlesLettersOf(match.label)

    for (const side of sides) {
      const [playerId] = match[side].playerIds

      if (lineLetters !== null && playerId !== undefined) {
        letters.set(playerId, lineLetters[side])
      }
    }
  }

  return letters
}

/** One player in a chip: his sheet letter, his name and his ranking points when known. */
export type ChipPlayer = {
  /** The worst card he carries in the encounter, `null` without one: a doubles shows it on his own line. */
  card: CardPenalty | null
  id: PlayerId
  name: string
  points: number | null
}

/** The side of a live match as its chip shows it: one letter square and one line per player. */
export type WallSide = {
  /** The worst card a player of this side carries in the encounter, `null` without one. */
  card: CardPenalty | null
  letters: string
  players: ChipPlayer[]
  /** The worst card given to the side in this match without naming a player. */
  sideCard: CardPenalty | null
}

const worseCard = (
  current: CardPenalty | null,
  next: CardPenalty
): CardPenalty => (current === null || next > current ? next : current)

export const wallSideOf = ({
  match,
  matches,
  players,
  side
}: {
  match: MatchView
  /** Every match of the encounter. */
  matches: readonly MatchView[]
  players: readonly Player[]
  side: Side
}): WallSide => {
  const { playerIds } = match[side]
  const letters = lettersByPlayer(matches)
  const lineLetters = singlesLettersOf(match.label)
  const cards = matches.flatMap((candidate) => candidate.state.cards)
  const sideCards = match.state.cards.filter(
    (shown) => shown.playerId === null && shown.side === side
  )
  const worstOf = (shown: readonly { penalty: CardPenalty }[]) =>
    shown.reduce<CardPenalty | null>(
      (worst, next) => worseCard(worst, next.penalty),
      null
    )
  const cardOf = (playerId: PlayerId) =>
    worstOf(cards.filter((shown) => shown.playerId === playerId))
  const card = worstOf([
    ...sideCards,
    ...cards.filter(
      (shown) => shown.playerId !== null && playerIds.includes(shown.playerId)
    )
  ])

  return {
    card,
    letters:
      lineLetters?.[side] ??
      playerIds.map((playerId) => letters.get(playerId) ?? '').join(''),
    players: playerIds.flatMap((playerId) => {
      const player = players.find((candidate) => candidate.id === playerId)

      return player === undefined
        ? []
        : [
            {
              card: cardOf(player.id),
              id: player.id,
              name: player.name,
              points: player.points
            }
          ]
    }),
    sideCard: worstOf(sideCards)
  }
}
