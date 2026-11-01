import type { PlayerId } from '@scoreboard/protocol/identifiers'
import type { MatchState } from '@scoreboard/protocol/match-state'
import type { CardPenalty } from '@scoreboard/protocol/scoring-event'
import type { Side } from '@scoreboard/protocol/side'

/**
 * A player's cards count over the whole encounter: the first is a yellow, the
 * second a yellow and red worth a point to the opponent, every later one two.
 * A side with nobody named counts only the cards of the match being played.
 */
export const nextCardPenalty = ({
  current,
  earlier,
  playerId,
  side
}: {
  current: MatchState
  /** The other matches of the encounter, whatever their order. */
  earlier: readonly MatchState[]
  playerId: PlayerId | null
  side: Side
}): CardPenalty => {
  const held =
    playerId === null
      ? current.cards.filter(
          (card) => card.side === side && card.playerId === null
        ).length
      : [current, ...earlier]
          .flatMap((state) => state.cards)
          .filter((card) => card.playerId === playerId).length

  if (held === 0) {
    return 0
  }

  return held === 1 ? 1 : 2
}
