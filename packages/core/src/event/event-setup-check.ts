import { Result } from '@adrienlcp/result'

import type { SetupRefusal } from '@scoreboard/protocol/error-code'
import type { EventSetup } from '@scoreboard/protocol/event-setup'

const hasDuplicates = (ids: readonly string[]): boolean =>
  new Set(ids).size !== ids.length

/**
 * The references a setup must keep consistent: every player, team and
 * encounter a record points at exists, and every table is one the event has.
 */
export const checkEventSetup = (
  setup: EventSetup
): Result<EventSetup, SetupRefusal> => {
  const ids = [
    ...setup.players.map((player) => player.id),
    ...setup.teams.map((team) => team.id),
    ...setup.matches.map((match) => match.id),
    ...setup.encounters.map((encounter) => encounter.id),
    ...setup.displays.map((display) => display.id)
  ]

  if (hasDuplicates(ids)) {
    return Result.failure('duplicate_id')
  }

  const playerIds = new Set(setup.players.map((player) => player.id))
  const teamIds = new Set(setup.teams.map((team) => team.id))
  const encounterIds = new Set(
    setup.encounters.map((encounter) => encounter.id)
  )

  const isTeamKnown = (teamId: string | null): boolean =>
    teamId === null || teamIds.has(teamId)

  const isEveryTeamKnown =
    setup.players.every((player) => isTeamKnown(player.teamId)) &&
    setup.encounters.every(
      (encounter) => teamIds.has(encounter.home) && teamIds.has(encounter.away)
    )

  if (!isEveryTeamKnown) {
    return Result.failure('unknown_team')
  }

  const isEveryDisplayTableKnown = setup.displays.every((display) =>
    display.tables.every((table) => table <= setup.tableCount)
  )

  if (!isEveryDisplayTableKnown) {
    return Result.failure('unknown_display_table')
  }

  for (const match of setup.matches) {
    const matchPlayerIds = [...match.home.playerIds, ...match.away.playerIds]

    if (!matchPlayerIds.every((playerId) => playerIds.has(playerId))) {
      return Result.failure('unknown_player')
    }

    if (hasDuplicates(matchPlayerIds)) {
      return Result.failure('player_twice_in_match')
    }

    if (match.encounterId !== null && !encounterIds.has(match.encounterId)) {
      return Result.failure('unknown_encounter')
    }

    if (match.table !== null && match.table > setup.tableCount) {
      return Result.failure('table_out_of_range')
    }
  }

  return Result.success(setup)
}
