import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { MatchId, PlayerId } from '@scoreboard/protocol/identifiers'
import type { Side } from '@scoreboard/protocol/side'

/** A match the absent player's side gives up, unplayed. */
export type ForfeitedMatch = { by: Side; matchId: MatchId }

/** What the forfeit reads of a match: who plays it and whether it began. */
type ForfeitableMatch = Pick<MatchView, 'away' | 'home' | 'id'> & {
  state: Pick<MatchView['state'], 'status'>
}

const sideOf = (match: ForfeitableMatch, playerId: PlayerId): Side | null => {
  if (match.home.playerIds.includes(playerId)) {
    return 'home'
  }

  return match.away.playerIds.includes(playerId) ? 'away' : null
}

/**
 * A player who does not come to the table loses every match of the encounter
 * still waiting for him, by walkover: there are no substitutes in a team
 * championship. A match already under way ends through its own concession.
 */
export const forfeitedMatchesOf = ({
  matches,
  playerId
}: {
  matches: readonly ForfeitableMatch[]
  playerId: PlayerId
}): ForfeitedMatch[] =>
  matches.flatMap((match) => {
    const by = sideOf(match, playerId)

    return by === null || match.state.status !== 'scheduled'
      ? []
      : [{ by, matchId: match.id }]
  })
