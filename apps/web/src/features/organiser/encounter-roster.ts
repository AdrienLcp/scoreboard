import type { DirectoryPlayer } from '@scoreboard/protocol/club-record'
import type { Player } from '@scoreboard/protocol/event-setup'
import type { FederationPlayer } from '@scoreboard/protocol/federation'
import type { PlayerId } from '@scoreboard/protocol/identifiers'

import { isSameName, matchesTyped } from '@/features/club/directory-search'

/** A licensee picked straight from the FFTT's list carries his licence in his pick: he is in no directory. */
const FEDERATION_PICK_PREFIX = 'fftt:'

export const federationPickOf = (licence: string): string =>
  `${FEDERATION_PICK_PREFIX}${licence}`

export const licenceOfPick = (pick: string): string | null =>
  pick.startsWith(FEDERATION_PICK_PREFIX)
    ? pick.slice(FEDERATION_PICK_PREFIX.length)
    : null

export type RosterRow = {
  /** A directory or day player's id, or a federation pick. */
  id: string
  licence: string | null
  name: string
  points: number | null
  /** The letter he already holds on this sheet. */
  seat: string | null
  /** Where his name and points come from: the FFTT, or what the club typed. */
  source: 'fftt' | 'typed'
}

/** `played` for the team's last players, `licensees` for the rest of the FFTT's list, `typed` for the rest of the directory, `day` without a club. */
export type RosterGroupKind = 'day' | 'licensees' | 'played' | 'typed'

export type RosterGroup = { kind: RosterGroupKind; rows: RosterRow[] }

/** "AUVINET" as "Auvinet", "LE GALL-BRIAND" as "Le Gall-Briand": the federation writes family names in capitals. */
export const federationFamilyName = (lastName: string): string =>
  lastName
    .toLocaleLowerCase('fr')
    .replace(
      /(^|[\s'’-])(\p{L})/gu,
      (_, before: string, letter: string) =>
        `${before}${letter.toLocaleUpperCase('fr')}`
    )

export const federationNameOf = (player: FederationPlayer): string =>
  `${player.firstName} ${federationFamilyName(player.lastName)}`.trim()

/** The day's player a licensee becomes once seated. */
export const eventPlayerFromFederation = ({
  id,
  player,
  teamId
}: {
  id: PlayerId
  player: FederationPlayer
  teamId: Player['teamId']
}): Player => ({
  id,
  licence: player.licence,
  name: federationNameOf(player),
  points: player.points,
  teamId
})

const byPointsThenName = (one: RosterRow, other: RosterRow) =>
  (other.points ?? -1) - (one.points ?? -1) ||
  one.name.localeCompare(other.name, 'fr')

const matchesSearch = (row: RosterRow, typed: string) => {
  const search = typed.trim()

  return (
    search === '' ||
    (/^\d+$/.test(search)
      ? (row.licence?.startsWith(search) ?? false)
      : matchesTyped(row.name, search))
  )
}

/** The FFTT's entry for a player the club typed: same licence, or same name when he was typed without one. */
const federationTwinOf = (
  player: DirectoryPlayer,
  licensees: readonly FederationPlayer[]
): FederationPlayer | undefined =>
  licensees.find((licensee) =>
    player.licence === null
      ? isSameName(
          `${player.firstName} ${player.lastName}`,
          `${licensee.firstName} ${licensee.lastName}`
        )
      : licensee.licence === player.licence
  )

type ClubRosterInput = {
  /** The club's directory players. */
  directory: readonly DirectoryPlayer[]
  /** The club's licensees at the FFTT, `null` while they are not there. */
  licensees: readonly FederationPlayer[] | null
  /** The day's players, to find who holds which letter. */
  players: readonly Player[]
  /** Letters held on this side, in the order of `letters`. */
  seats: readonly (PlayerId | null)[]
  letters: readonly string[]
  /** The team's last composition, kept in the directory. */
  teamLineup: readonly (PlayerId | null)[]
  typed: string
}

const seatOf = ({
  id,
  letters,
  licence,
  players,
  seats
}: Pick<ClubRosterInput, 'letters' | 'players' | 'seats'> & {
  id: string | null
  licence: string | null
}): string | null => {
  const index = seats.findIndex((seated) => {
    if (seated === null) {
      return false
    }

    if (seated === id) {
      return true
    }

    const player = players.find((candidate) => candidate.id === seated)

    return licence !== null && player?.licence === licence
  })

  return index === -1 ? null : (letters.at(index) ?? null)
}

/**
 * A team's roster for its letters, in the order a Sunday morning reads it:
 * those who played for the team last, then the club's other licensees at the
 * FFTT, then the players only the club typed, each by points. A typed player
 * the FFTT also lists shows once, as the FFTT's entry, under his directory id
 * (nothing is merged in storage: terms of use, art. 4.1).
 */
export const clubRosterOf = (input: ClubRosterInput): RosterGroup[] => {
  const licensees = input.licensees ?? []
  const twinned = new Set<string>()

  const directoryRows = input.directory.map((player) => {
    const twin = federationTwinOf(player, licensees)

    if (twin !== undefined) {
      twinned.add(twin.licence)
    }

    const row: RosterRow = {
      id: player.id,
      licence: twin?.licence ?? player.licence,
      name:
        twin === undefined
          ? `${player.firstName} ${player.lastName}`
          : federationNameOf(twin),
      points: twin === undefined ? player.points : twin.points,
      seat: seatOf({ ...input, id: player.id, licence: player.licence }),
      source: twin === undefined ? 'typed' : 'fftt'
    }

    return {
      hasPlayed:
        input.teamLineup.includes(player.id) ||
        player.lastPlayedOn !== undefined,
      row
    }
  })

  const licenseeRows = licensees
    .filter((licensee) => !twinned.has(licensee.licence))
    .map(
      (licensee): RosterRow => ({
        id: federationPickOf(licensee.licence),
        licence: licensee.licence,
        name: federationNameOf(licensee),
        points: licensee.points,
        seat: seatOf({ ...input, id: null, licence: licensee.licence }),
        source: 'fftt'
      })
    )

  const rowsWhere = (
    keep: (entry: (typeof directoryRows)[number]) => boolean
  ) => directoryRows.filter(keep).map(({ row }) => row)
  const groups: RosterGroup[] = [
    { kind: 'played', rows: rowsWhere(({ hasPlayed }) => hasPlayed) },
    {
      kind: 'licensees',
      rows: [
        ...licenseeRows,
        ...rowsWhere(
          ({ hasPlayed, row }) => !hasPlayed && row.source === 'fftt'
        )
      ]
    },
    {
      kind: 'typed',
      rows: rowsWhere(
        ({ hasPlayed, row }) => !hasPlayed && row.source === 'typed'
      )
    }
  ]

  return groups
    .map((group) => ({
      kind: group.kind,
      rows: group.rows
        .filter((row) => matchesSearch(row, input.typed))
        .toSorted(byPointsThenName)
    }))
    .filter((group) => group.rows.length > 0)
}

/** Without a club behind the team: the day's own players, by points. */
export const dayRosterOf = ({
  letters,
  players,
  seats,
  typed
}: Pick<
  ClubRosterInput,
  'letters' | 'players' | 'seats' | 'typed'
>): RosterGroup[] => {
  const rows = players
    .map(
      (player): RosterRow => ({
        id: player.id,
        licence: player.licence,
        name: player.name,
        points: player.points,
        seat: seatOf({
          id: player.id,
          letters,
          licence: null,
          players,
          seats
        }),
        source: 'typed'
      })
    )
    .filter((row) => matchesSearch(row, typed))
    .toSorted(byPointsThenName)

  return rows.length === 0 ? [] : [{ kind: 'day', rows }]
}

/**
 * Who a roster pick seats: a licensee straight from the FFTT becomes a day's
 * player, under the id he already has today or a new one; a typed player the
 * FFTT also lists keeps his directory id and brings the FFTT's points.
 */
export const seatingOfPick = ({
  dayPlayers,
  licensees,
  newPlayerId,
  pick,
  rows,
  teamId
}: {
  dayPlayers: readonly Player[]
  licensees: readonly FederationPlayer[]
  newPlayerId: () => PlayerId
  pick: string
  rows: readonly RosterRow[]
  teamId: Player['teamId']
}): { id: PlayerId; player: Player | null } => {
  const row = rows.find((candidate) => candidate.id === pick)
  const licence = licenceOfPick(pick)
  const licensee = licensees.find(
    (player) => player.licence === (licence ?? row?.licence)
  )

  if (licensee === undefined || row?.source !== 'fftt') {
    return { id: pick, player: null }
  }

  const known = dayPlayers.find(
    (player) =>
      player.teamId === teamId &&
      (player.id === pick || player.licence === licensee.licence)
  )
  const id = licence === null ? pick : (known?.id ?? newPlayerId())

  return {
    id,
    player: eventPlayerFromFederation({ id, player: licensee, teamId })
  }
}
