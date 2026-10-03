import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { PlayerId } from '@scoreboard/protocol/identifiers'

export const involvesAnyOf = (
  match: Pick<MatchView, 'away' | 'home'>,
  playerIds: readonly PlayerId[]
): boolean =>
  [...match.home.playerIds, ...match.away.playerIds].some((id) =>
    playerIds.includes(id)
  )

/** A tab's matches split in two, keeping their order: the followed players' first. */
export const followedFirst = (
  matches: readonly MatchView[],
  followed: readonly PlayerId[]
): { followed: MatchView[]; others: MatchView[] } => ({
  followed: matches.filter((match) => involvesAnyOf(match, followed)),
  others: matches.filter((match) => !involvesAnyOf(match, followed))
})
