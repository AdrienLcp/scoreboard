import type React from 'react'

import type { ClubRecord } from '@scoreboard/protocol/club-record'
import type { Player } from '@scoreboard/protocol/event-setup'
import type {
  FederationClubNumber,
  FederationPlayer
} from '@scoreboard/protocol/federation'
import type { PlayerId, TableNumber } from '@scoreboard/protocol/identifiers'
import type { Side } from '@scoreboard/protocol/side'

import type { ClubSide } from '@scoreboard/core/club/club-encounter'
import type { EncounterFormat } from '@scoreboard/core/encounter/encounter-format'

import { splitTypedName } from '@/features/club/directory-search'
import { FederationLink } from '@/features/club/federation-link'
import { useFederationClubPlayers } from '@/features/club/federation-queries'
import type { FederationState } from '@/features/club/use-federation'
import { newPlayerId } from '@/infrastructure/ids'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import {
  EncounterLineup,
  type LineupSide,
  type RosterNotice
} from './encounter-lineup'
import { eventPlayerFrom, seatLetter } from './encounter-lineups'
import { clubRosterOf, seatingOfPick } from './encounter-roster'
import { useSheetOrderHint } from './sheet-order-hint'

export type SeatedLineup = readonly (PlayerId | null)[]

/** Licensees picked from the FFTT before the encounter exists, by the id they will play under. */
export type DayPlayers = ReadonlyMap<PlayerId, Player>

/** Who holds a letter as the day will show him: the FFTT's entry when one was picked, else the club's. */
const dayPlayerOf = (
  side: ClubSide,
  dayPlayers: DayPlayers,
  playerId: PlayerId | null
): Player | null => {
  if (playerId === null) {
    return null
  }

  const directoryPlayer = side.club.players.find(
    (player) => player.id === playerId
  )

  return (
    dayPlayers.get(playerId) ??
    (directoryPlayer === undefined
      ? null
      : eventPlayerFrom(directoryPlayer, side.team.id))
  )
}

/** How a side's composition reads folded: each letter and who holds it. */
export const lineupSummaryOf = ({
  dayPlayers,
  letters,
  lineup,
  side
}: {
  dayPlayers: DayPlayers
  letters: readonly string[]
  lineup: SeatedLineup
  side: ClubSide
}): string =>
  letters
    .map((letter, index) => {
      const name = dayPlayerOf(side, dayPlayers, lineup.at(index) ?? null)?.name
      const [first = '–', ...family] = name?.split(' ') ?? []

      return `${letter} ${family.length === 0 ? first : family.join(' ')}`
    })
    .join(' · ')

const noticeOf = (
  answer: FederationState<FederationPlayer[]> | null
): RosterNotice | null =>
  answer === null || answer.status === 'ready' || answer.status === 'off'
    ? null
    : answer.status

type ClubEncounterLineupProps = {
  away: ClubSide
  dayPlayers: DayPlayers
  format: EncounterFormat
  home: ClubSide
  lineups: Readonly<Record<Side, SeatedLineup>>
  /** Adds a typed licensee to a side's club; his id, or `null` when the name will not do. */
  onAddPlayer: (side: ClubSide, typed: string) => PlayerId | null
  onChange: (side: Side, lineup: SeatedLineup) => void
  /** A licensee picked from the FFTT, to join the day with the encounter. */
  onDayPlayer: (player: Player) => void
  onLink: (clubId: string, number: FederationClubNumber) => void
  record: ClubRecord
  tables: readonly TableNumber[]
}

/**
 * The compositions of an encounter still to add, letter by letter as the
 * encounter's own sheet picks them: each letter opens its team's roster,
 * played for the team first, then the club's FFTT licensees, then the
 * players only typed; one tap seats a player and the next empty letter
 * comes up.
 */
export const ClubEncounterLineup: React.FC<ClubEncounterLineupProps> = ({
  away,
  dayPlayers,
  format,
  home,
  lineups,
  onAddPlayer,
  onChange,
  onDayPlayer,
  onLink,
  record,
  tables
}) => {
  const translate = useTranslate()
  const hint = useSheetOrderHint({ format, tables })
  const sides = { away, home }
  const letters = { away: format.awayLetters, home: format.homeLetters }
  const licensees = {
    away: useFederationClubPlayers(away.club.number),
    home: useFederationClubPlayers(home.club.number)
  }
  const licenseesOf = (side: Side) => {
    const answer = licensees[side]

    return answer?.status === 'ready' ? answer.data : null
  }

  const rosterOf = (side: Side, typed: string) =>
    clubRosterOf({
      directory: sides[side].club.players,
      letters: letters[side],
      licensees: licenseesOf(side),
      players: [...dayPlayers.values()],
      seats: lineups[side],
      teamLineup: sides[side].team.lineup,
      typed
    })

  const pickFor = (side: Side, index: number, pick: string | null) => {
    const seat = (playerId: PlayerId | null) =>
      onChange(side, seatLetter({ index, lineup: lineups[side], playerId }))

    if (pick === null) {
      seat(null)
      return
    }

    const seating = seatingOfPick({
      dayPlayers: [...dayPlayers.values()],
      licensees: licenseesOf(side) ?? [],
      newPlayerId,
      pick,
      rows: rosterOf(side, '').flatMap((group) => group.rows),
      teamId: sides[side].team.id
    })

    if (seating.player !== null) {
      onDayPlayer(seating.player)
    }

    seat(seating.id)
  }

  const lineupSideOf = (side: Side): LineupSide => {
    const clubSide = sides[side]

    return {
      addLabel: (typed) =>
        splitTypedName(typed) === null
          ? null
          : translate('organiser.pick.addPlayer', { name: typed.trim() }),
      clubName: clubSide.club.name,
      colour: clubSide.team.colour,
      hasFederation: licensees[side]?.status === 'ready',
      letters: letters[side],
      lineup: lineups[side],
      link:
        clubSide.club.number === null ? (
          <FederationLink
            club={clubSide.club}
            isOwn={record.own.id === clubSide.club.id}
            onLink={(number) => onLink(clubSide.club.id, number)}
          />
        ) : null,
      notice: noticeOf(licensees[side]),
      onAdd: (typed) => onAddPlayer(clubSide, typed),
      onChange: (next) => onChange(side, next),
      onPick: (index, pick) => pickFor(side, index, pick),
      roster: (typed) => rosterOf(side, typed),
      seated: lineups[side].map((playerId) => {
        const player = dayPlayerOf(clubSide, dayPlayers, playerId)

        return player === null
          ? null
          : { name: player.name, points: player.points }
      }),
      teamName: clubSide.team.name
    }
  }

  return (
    <EncounterLineup
      away={lineupSideOf('away')}
      groupCount={format.groupCount}
      hint={hint}
      home={lineupSideOf('home')}
      tables={tables}
    />
  )
}
