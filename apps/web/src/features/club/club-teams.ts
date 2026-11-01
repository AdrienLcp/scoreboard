import type { ClubRecord } from '@scoreboard/protocol/club-record'
import type { TeamId } from '@scoreboard/protocol/identifiers'

import type { ClubSide } from '@scoreboard/core/club/club-encounter'

/** A team of the club's directory, ours or an opponent's, with the club it plays for. */
export const clubSideOf = (
  record: ClubRecord,
  teamId: TeamId | null
): ClubSide | null => {
  for (const club of [record.own, ...record.opponents]) {
    const team = club.teams.find((candidate) => candidate.id === teamId)

    if (team !== undefined) {
      return { club, team }
    }
  }

  return null
}

export const isOwnTeam = (record: ClubRecord, teamId: TeamId | null): boolean =>
  record.own.teams.some((team) => team.id === teamId)
