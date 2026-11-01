import type { Player } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'

import { umpireOf } from '@scoreboard/core/encounter/umpire-turn'

/**
 * Who umpires a match of a team encounter, by full name; `null` outside an
 * encounter or when nobody does.
 */
export const umpireNameOf = ({
  encounterMatches,
  match,
  players
}: {
  /** Every match of its encounter, in the sheet's order. */
  encounterMatches: readonly MatchView[]
  match: MatchView
  players: readonly Player[]
}): string | null => {
  if (match.encounterId === null) {
    return null
  }

  const umpireId = umpireOf({
    encounterMatches: encounterMatches.filter(
      (other) => other.encounterId === match.encounterId
    ),
    match
  })

  return players.find((player) => player.id === umpireId)?.name ?? null
}
