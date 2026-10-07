import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { PlayerId } from '@scoreboard/protocol/identifiers'

import type { SpectatorProgramme } from '@scoreboard/core/event/spectator-programme'

import { involvesAnyOf } from './followed-first'

/** Where a player can be found now, as the follow field lists it. */
export type PlayerWhereabouts =
  | { status: 'live'; table: number | null }
  | { status: 'finished' | 'unplaced' | 'upcoming' }

/** A registered player placed in no match yet is `unplaced`, never among the results. */
export const whereaboutsOf = (
  playerId: PlayerId,
  programme: SpectatorProgramme
): PlayerWhereabouts => {
  const isInvolved = (match: MatchView) => involvesAnyOf(match, [playerId])
  const live = programme.live.find(isInvolved)

  if (live !== undefined) {
    return { status: 'live', table: live.table }
  }

  if (programme.upcoming.some(isInvolved)) {
    return { status: 'upcoming' }
  }

  return programme.finished.some(isInvolved)
    ? { status: 'finished' }
    : { status: 'unplaced' }
}
