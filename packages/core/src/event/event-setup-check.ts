import { Result } from '@adrienlcp/result'

import type { SetupRefusal } from '@scoreboard/protocol/error-code'
import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type { MatchId } from '@scoreboard/protocol/identifiers'

import { isTournamentConsistent } from '../tournament/tournament-check'

const hasDuplicates = (ids: readonly string[]): boolean =>
  new Set(ids).size !== ids.length

/**
 * The references a setup must keep consistent: every player, team and
 * encounter a record points at exists, every table is one the event has, and
 * a tournament's pools and stage matches agree.
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

  if (!isTournamentConsistent(setup)) {
    return Result.failure('tournament_inconsistent')
  }

  return Result.success(setup)
}

/**
 * What a new setup may not change in the one it replaces: the format of a
 * match already under way or over, whose score was counted against it.
 */
export const checkSetupChange = ({
  next,
  previous,
  startedMatchIds
}: {
  next: EventSetup
  previous: EventSetup
  startedMatchIds: ReadonlySet<MatchId>
}): Result<EventSetup, SetupRefusal> => {
  const previousFormats = new Map(
    previous.matches.map((match) => [match.id, JSON.stringify(match.format)])
  )
  const isStartedFormatChanged = next.matches.some(
    (match) =>
      startedMatchIds.has(match.id) &&
      previousFormats.has(match.id) &&
      previousFormats.get(match.id) !== JSON.stringify(match.format)
  )

  return isStartedFormatChanged
    ? Result.failure('started_match_format_changed')
    : Result.success(next)
}
