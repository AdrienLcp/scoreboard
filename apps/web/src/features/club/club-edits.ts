import type {
  ClubRecord,
  DirectoryClub,
  DirectoryClubId,
  DirectoryPlayer,
  DirectoryTeam
} from '@scoreboard/protocol/club-record'
import { encounterFormatIds } from '@scoreboard/protocol/encounter-format-id'
import type { ClubHallPlanId, HallPlan } from '@scoreboard/protocol/hall-plan'
import type { PlayerId, TeamId } from '@scoreboard/protocol/identifiers'
import type { LogoUrl } from '@scoreboard/protocol/logo'
import { DEFAULT_MATCH_POINTS_RULE } from '@scoreboard/protocol/match-points-rule'

import { nextTeamColour } from '@scoreboard/core/club/team-colours'
import { encounterFormatFor } from '@scoreboard/core/encounter/encounter-formats'

import { clubNameOfTeam, isSameName, splitTypedName } from './directory-search'

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
 * A new team named after its club and numbered ("Angles 3") unless named, in
 * the next colour nobody wears, on the club's format; our own teams also take
 * the next free pair of tables, team 1 on tables 1–2.
 */
export const addTeam = ({
  clubId,
  name,
  newTeamId,
  record
}: {
  clubId: DirectoryClubId
  name?: string
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
    name: name ?? `${club?.name ?? ''} ${number}`.trim(),
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
    {
      id: newClubId(),
      logoUrl: null,
      name,
      number: null,
      players: [],
      teams: []
    }
  ]
})

export const removeOpponentClub = (
  record: ClubRecord,
  clubId: DirectoryClubId
): ClubRecord => ({
  ...record,
  opponents: record.opponents.filter((club) => club.id !== clubId)
})

/**
 * Ties a club of the directory to its FFTT number, the key its licensees and
 * teams are read by, or unties it with `null`. Only the number is kept: the
 * federation's data itself stays in its 24-hour cache (terms of use, art. 4.2).
 */
export const linkFederationClub = ({
  clubId,
  number,
  record
}: {
  clubId: DirectoryClubId
  number: DirectoryClub['number']
  record: ClubRecord
}): ClubRecord => editClub(record, clubId, (club) => ({ ...club, number }))

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

export const changeClubLogo = ({
  clubId,
  logoUrl,
  record
}: {
  clubId: DirectoryClubId
  logoUrl: LogoUrl | null
  record: ClubRecord
}): ClubRecord => editClub(record, clubId, (club) => ({ ...club, logoUrl }))

const withTeamLineup = (
  club: DirectoryClub,
  teamId: TeamId,
  lineup: readonly (PlayerId | null)[]
): DirectoryClub => ({
  ...club,
  teams: club.teams.map((team) =>
    team.id === teamId ? { ...team, lineup: [...lineup] } : team
  )
})

/** The day's composition becomes the team's last one: its next encounter starts from it. */
export const keepLineup = ({
  lineup,
  record,
  teamId
}: {
  lineup: readonly (PlayerId | null)[]
  record: ClubRecord
  teamId: TeamId
}): ClubRecord => ({
  ...record,
  opponents: record.opponents.map((club) =>
    withTeamLineup(club, teamId, lineup)
  ),
  own: withTeamLineup(record.own, teamId, lineup)
})

/** The plan new events start from: the default saved plan, or none. */
export const defaultPlanOf = (record: ClubRecord): HallPlan | null =>
  (
    record.plans.find((saved) => saved.id === record.defaultPlanId) ??
    record.plans[0]
  )?.plan ?? null

/**
 * Keeps an event's plan for the club under a name; a plan of the same name
 * is replaced. A table put away was put away for that day only: it stands
 * again in the saved plan.
 */
export const saveClubPlan = ({
  id,
  isDefault,
  name,
  plan,
  record
}: {
  id: ClubHallPlanId
  isDefault: boolean
  name: string
  plan: HallPlan
  record: ClubRecord
}): ClubRecord => {
  const replaced = record.plans.find(
    (saved) => saved.name?.toLowerCase() === name.toLowerCase()
  )
  const savedId = replaced?.id ?? id
  const saved = {
    id: savedId,
    name,
    plan: {
      ...plan,
      tables: plan.tables.map((table) => ({ ...table, isHidden: false }))
    }
  }

  return {
    ...record,
    defaultPlanId:
      isDefault || record.plans.length === 0 ? savedId : record.defaultPlanId,
    plans:
      replaced === undefined
        ? [...record.plans, saved]
        : record.plans.map((candidate) =>
            candidate.id === savedId ? saved : candidate
          )
  }
}

export const setDefaultClubPlan = (
  record: ClubRecord,
  id: ClubHallPlanId
): ClubRecord => ({ ...record, defaultPlanId: id })

export const deleteClubPlan = (
  record: ClubRecord,
  id: ClubHallPlanId
): ClubRecord => {
  const plans = record.plans.filter((saved) => saved.id !== id)

  return {
    ...record,
    defaultPlanId:
      record.defaultPlanId === id
        ? (plans[0]?.id ?? null)
        : record.defaultPlanId,
    plans
  }
}

/**
 * A licensee typed where the search found nobody: kept in his club as typed,
 * so he is picked next time. `null` when the name is not a first and a family
 * name.
 */
export const addTypedPlayer = ({
  clubId,
  newPlayerId,
  record,
  typed
}: {
  clubId: DirectoryClubId
  newPlayerId: () => PlayerId
  record: ClubRecord
  typed: string
}): { playerId: PlayerId; record: ClubRecord } | null => {
  const name = splitTypedName(typed)

  if (name === null) {
    return null
  }

  const player: DirectoryPlayer = {
    ...name,
    id: newPlayerId(),
    licence: null,
    points: null,
    source: 'typed'
  }

  return {
    playerId: player.id,
    record: addLicensee({ clubId, player, record })
  }
}

/** "Riverside 4" belongs to the club named "Riverside", or to "TT Riverside" whose teams are named "Riverside 1", "Riverside 2". */
export const isClubOfTeamName = (
  club: DirectoryClub,
  clubName: string
): boolean =>
  isSameName(club.name, clubName) ||
  club.teams.some((team) => isSameName(clubNameOfTeam(team.name), clubName))

type TypedTeamEdit = {
  newClubId: () => DirectoryClubId
  newTeamId: () => TeamId
  record: ClubRecord
  typed: string
}

type AddedTeam = { record: ClubRecord; teamId: TeamId }

/**
 * An opposing team typed where the search found none ("Rivals 4"): it joins
 * the club its name starts with, which is created when the club is new, in
 * the opponents' colour and the club's own format.
 */
export const addTypedOpponentTeam = ({
  newClubId,
  newTeamId,
  record,
  typed
}: TypedTeamEdit): AddedTeam => {
  const name = typed.trim()
  const clubName = clubNameOfTeam(name)
  const known = record.opponents.find((club) =>
    isClubOfTeamName(club, clubName)
  )
  const clubId = known?.id ?? newClubId()
  const withClub =
    known === undefined
      ? addOpponentClub({ name: clubName, newClubId: () => clubId, record })
      : record
  const team: DirectoryTeam = {
    colour: record.opponentColour,
    division: null,
    formatId: record.own.teams.at(0)?.formatId ?? encounterFormatIds[0],
    id: newTeamId(),
    lineup: [],
    matchPoints: DEFAULT_MATCH_POINTS_RULE,
    name,
    tables: []
  }

  return {
    record: editClub(withClub, clubId, (club) => ({
      ...club,
      teams: [...club.teams, team]
    })),
    teamId: team.id
  }
}

/**
 * A team typed where the search found none, ours or theirs: named after our
 * club, it joins our teams on the next free tables, as the club page adds one;
 * any other name joins its opposing club.
 */
export const addTypedTeam = (edit: TypedTeamEdit): AddedTeam => {
  const name = edit.typed.trim()

  if (!isClubOfTeamName(edit.record.own, clubNameOfTeam(name))) {
    return addTypedOpponentTeam(edit)
  }

  const teamId = edit.newTeamId()

  return {
    record: addTeam({
      clubId: edit.record.own.id,
      name,
      newTeamId: () => teamId,
      record: edit.record
    }),
    teamId
  }
}

/** Stamps the day on the teams and licensees an encounter brings: the pickers offer them first next time. */
export const markPlayed = ({
  on,
  playerIds,
  record,
  teamIds
}: {
  on: string
  playerIds: readonly PlayerId[]
  record: ClubRecord
  teamIds: readonly TeamId[]
}): ClubRecord => {
  const stamp = (club: DirectoryClub): DirectoryClub => ({
    ...club,
    players: club.players.map((player) =>
      playerIds.includes(player.id) ? { ...player, lastPlayedOn: on } : player
    ),
    teams: club.teams.map((team) =>
      teamIds.includes(team.id) ? { ...team, lastPlayedOn: on } : team
    )
  })

  return {
    ...record,
    opponents: record.opponents.map(stamp),
    own: stamp(record.own)
  }
}

/**
 * A player away for the whole day goes in the second group (D–F, R–T), as the
 * club always does. `null` while no seat of the first group is empty ahead of
 * a seated player of the second; otherwise the same players in the same
 * order, moved up, with the empty seats last.
 */
export const absentSeatsLast = ({
  groupSize,
  letterCount,
  lineup
}: {
  groupSize: number
  letterCount: number
  lineup: readonly (PlayerId | null)[]
}): (PlayerId | null)[] | null => {
  const seats = Array.from(
    { length: letterCount },
    (_, index) => lineup.at(index) ?? null
  )
  const hasEmptyFirstSeat = seats.slice(0, groupSize).includes(null)
  const hasSecondGroupPlayer = seats
    .slice(groupSize)
    .some((seat) => seat !== null)

  if (groupSize >= letterCount || !hasEmptyFirstSeat || !hasSecondGroupPlayer) {
    return null
  }

  const seated = seats.filter((seat) => seat !== null)

  return seats.map((_, index) => seated.at(index) ?? null)
}
