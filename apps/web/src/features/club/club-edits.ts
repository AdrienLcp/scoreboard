import type {
  ClubRecord,
  DirectoryClub,
  DirectoryClubId,
  DirectoryPlayer,
  DirectoryTeam
} from '@scoreboard/protocol/club-record'
import { encounterFormatIds } from '@scoreboard/protocol/encounter-format-id'
import type { PlayerId, TeamId } from '@scoreboard/protocol/identifiers'
import { DEFAULT_MATCH_POINTS_RULE } from '@scoreboard/protocol/match-points-rule'

import { nextTeamColour } from '@scoreboard/core/club/team-colours'
import { encounterFormatFor } from '@scoreboard/core/encounter/encounter-formats'

const clubsOf = (record: ClubRecord): DirectoryClub[] => [
  record.own,
  ...record.opponents
]

const editClub = (
  record: ClubRecord,
  clubId: DirectoryClubId,
  edit: (club: DirectoryClub) => DirectoryClub
): ClubRecord => ({
  ...record,
  opponents: record.opponents.map((club) =>
    club.id === clubId ? edit(club) : club
  ),
  own: record.own.id === clubId ? edit(record.own) : record.own
})

/**
 * A new team named after its club and numbered ("Angles 3"), in the next
 * colour nobody wears, on the club's format; our own teams also take the next
 * free pair of tables, team 1 on tables 1–2.
 */
export const addTeam = ({
  clubId,
  newTeamId,
  record
}: {
  clubId: DirectoryClubId
  newTeamId: () => TeamId
  record: ClubRecord
}): ClubRecord => {
  const isOwn = clubId === record.own.id
  const club = clubsOf(record).find((candidate) => candidate.id === clubId)
  const number = (club?.teams.length ?? 0) + 1
  const formatId = record.own.teams.at(0)?.formatId ?? encounterFormatIds[0]
  const groupCount = encounterFormatFor(formatId).groupCount
  const firstTable = (number - 1) * groupCount + 1

  const team: DirectoryTeam = {
    colour: isOwn
      ? nextTeamColour(record.own.teams.map((candidate) => candidate.colour))
      : record.opponentColour,
    division: null,
    formatId,
    id: newTeamId(),
    lineup: [],
    matchPoints: DEFAULT_MATCH_POINTS_RULE,
    name: `${club?.name ?? ''} ${number}`.trim(),
    tables: isOwn
      ? Array.from({ length: groupCount }, (_, index) => firstTable + index)
      : []
  }

  return editClub(record, clubId, (current) => ({
    ...current,
    teams: [...current.teams, team]
  }))
}

export const updateTeam = ({
  clubId,
  record,
  team
}: {
  clubId: DirectoryClubId
  record: ClubRecord
  team: DirectoryTeam
}): ClubRecord =>
  editClub(record, clubId, (club) => ({
    ...club,
    teams: club.teams.map((candidate) =>
      candidate.id === team.id ? team : candidate
    )
  }))

export const removeTeam = ({
  clubId,
  record,
  teamId
}: {
  clubId: DirectoryClubId
  record: ClubRecord
  teamId: TeamId
}): ClubRecord =>
  editClub(record, clubId, (club) => ({
    ...club,
    teams: club.teams.filter((team) => team.id !== teamId)
  }))

export const addLicensee = ({
  clubId,
  player,
  record
}: {
  clubId: DirectoryClubId
  player: DirectoryPlayer
  record: ClubRecord
}): ClubRecord =>
  editClub(record, clubId, (club) => ({
    ...club,
    players: [...club.players, player]
  }))

/** Takes the player off the club and out of every composition. */
export const removeLicensee = ({
  clubId,
  playerId,
  record
}: {
  clubId: DirectoryClubId
  playerId: PlayerId
  record: ClubRecord
}): ClubRecord =>
  editClub(record, clubId, (club) => ({
    ...club,
    players: club.players.filter((player) => player.id !== playerId),
    teams: club.teams.map((team) => ({
      ...team,
      lineup: team.lineup.map((id) => (id === playerId ? null : id))
    }))
  }))

export const addOpponentClub = ({
  name,
  newClubId,
  record
}: {
  name: string
  newClubId: () => DirectoryClubId
  record: ClubRecord
}): ClubRecord => ({
  ...record,
  opponents: [
    ...record.opponents,
    { id: newClubId(), name, number: null, players: [], teams: [] }
  ]
})

export const removeOpponentClub = (
  record: ClubRecord,
  clubId: DirectoryClubId
): ClubRecord => ({
  ...record,
  opponents: record.opponents.filter((club) => club.id !== clubId)
})

/** Seats a player on a letter, leaving the letter he held before empty. */
export const seatPlayer = ({
  index,
  playerId,
  team
}: {
  index: number
  playerId: PlayerId | null
  team: DirectoryTeam
}): DirectoryTeam => {
  const length = Math.max(team.lineup.length, index + 1)
  const seats = Array.from({ length }, (_, seat) => {
    if (seat === index) {
      return playerId
    }

    const holder = team.lineup.at(seat) ?? null

    return holder === playerId ? null : holder
  })

  return { ...team, lineup: seats }
}
