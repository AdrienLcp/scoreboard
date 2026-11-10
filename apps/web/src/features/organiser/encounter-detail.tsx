import type React from 'react'
import { useRef, useState } from 'react'

import type {
  Encounter,
  EventSetup,
  Player
} from '@scoreboard/protocol/event-setup'
import type { PublicSnapshot } from '@scoreboard/protocol/event-snapshot'
import type { MatchId, PlayerId } from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'
import type { Side } from '@scoreboard/protocol/side'

import type { ClubSide } from '@scoreboard/core/club/club-encounter'
import { encounterFormatFor } from '@scoreboard/core/encounter/encounter-formats'

import {
  addTypedPlayer,
  keepLineup,
  linkFederationClub
} from '@/features/club/club-edits'
import { clubSideOf } from '@/features/club/club-teams'
import { splitTypedName } from '@/features/club/directory-search'
import { FederationLink } from '@/features/club/federation-link'
import { useFederationClubPlayers } from '@/features/club/federation-queries'
import { useClub } from '@/features/club/use-club'
import { encounterLinesFor } from '@/features/event/encounter-lines'
import { EncounterScore } from '@/features/event/encounter-score'
import { newPlayerId } from '@/infrastructure/ids'
import { Switch } from '@/presentation/components/switch'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import {
  EncounterLineup,
  type LineupSide,
  type RosterNotice
} from './encounter-lineup'
import {
  encounterLineupOf,
  eventPlayerFrom,
  seatLetter,
  sideLettersOf,
  withEncounterLineup
} from './encounter-lineups'
import {
  clubRosterOf,
  dayRosterOf,
  eventPlayerFromFederation,
  licenceOfPick
} from './encounter-roster'
import { PlayerForfeit } from './player-forfeit'
import { encounterTablesOf } from './setup-edits'
import { teamColourOf } from './team-chip'

import './club-encounter-form.sass'

type EncounterDetailProps = {
  encounter: Encounter
  event: PublicSnapshot
  onRecord: (matchId: MatchId, event: ScoringEvent) => void
  onSave: (setup: EventSetup, text: string) => void
  setup: EventSetup
}

const SIDES: readonly Side[] = ['home', 'away']

/**
 * An encounter opened: its running score once under way, its compositions
 * table by table, each letter picked from its team's club and kept for the
 * next time unless told not to, and the forfeit of a player who does not
 * come.
 */
export const EncounterDetail: React.FC<EncounterDetailProps> = ({
  encounter,
  event,
  onRecord,
  onSave,
  setup
}) => {
  const translate = useTranslate()
  const club = useClub()
  const record = club.state.status === 'ready' ? club.state.record : null
  const [keepsLineup, setKeepsLineup] = useState(true)
  const added = useRef(new Map<PlayerId, Player>())
  const format = encounterFormatFor(encounter.formatId)
  const tables = encounterTablesOf(setup, encounter.id)
  const startedMatchIds = new Set(
    event.matches.flatMap((match) =>
      match.encounterId === encounter.id && match.timing.startedAtMs !== null
        ? [match.id]
        : []
    )
  )
  const line = encounterLinesFor(event).find(
    (candidate) => candidate.id === encounter.id
  )
  const clubSideFor = (side: Side): ClubSide | null =>
    record === null ? null : clubSideOf(record, encounter[side])
  const teamNameOf = (side: Side) =>
    event.teams.find((team) => team.id === encounter[side])?.name ?? ''
  const licensees = {
    away: useFederationClubPlayers(clubSideFor('away')?.club.number ?? null),
    home: useFederationClubPlayers(clubSideFor('home')?.club.number ?? null)
  }
  const dayPlayers = () => [...setup.players, ...added.current.values()]

  const change = (side: Side, lineup: readonly (PlayerId | null)[]) => {
    const clubSide = clubSideFor(side)
    const newPlayers = lineup.flatMap((playerId) => {
      const directoryPlayer = clubSide?.club.players.find(
        (player) => player.id === playerId
      )
      const known =
        playerId === null
          ? undefined
          : (added.current.get(playerId) ??
            (directoryPlayer === undefined
              ? undefined
              : eventPlayerFrom(directoryPlayer, encounter[side])))

      return known === undefined ? [] : [known]
    })

    onSave(
      withEncounterLineup({
        encounter,
        lineup,
        newPlayers,
        setup,
        side,
        startedMatchIds
      }),
      translate('organiser.encountersStep.lineupChanged', {
        team: teamNameOf(side)
      })
    )

    if (keepsLineup && clubSide !== null) {
      const kept = lineup.map((playerId) =>
        clubSide.club.players.some((player) => player.id === playerId)
          ? playerId
          : null
      )
      club.edit((current) =>
        keepLineup({ lineup: kept, record: current, teamId: clubSide.team.id })
      )
    }
  }

  const addPlayerTo = (side: Side, typed: string): PlayerId | null => {
    const clubSide = clubSideFor(side)

    if (clubSide === null || record === null) {
      const name = typed.trim()

      if (name === '') {
        return null
      }

      const player: Player = {
        id: newPlayerId(),
        licence: null,
        name,
        points: null,
        teamId: encounter[side]
      }

      added.current.set(player.id, player)

      return player.id
    }

    const typedIn = addTypedPlayer({
      clubId: clubSide.club.id,
      newPlayerId,
      record,
      typed
    })
    const directoryPlayer =
      typedIn === null
        ? undefined
        : [typedIn.record.own, ...typedIn.record.opponents]
            .find((other) => other.id === clubSide.club.id)
            ?.players.find((player) => player.id === typedIn.playerId)

    if (typedIn === null || directoryPlayer === undefined) {
      return null
    }

    club.change(typedIn.record)
    added.current.set(
      typedIn.playerId,
      eventPlayerFrom(directoryPlayer, encounter[side])
    )

    return typedIn.playerId
  }

  const rosterOf = (side: Side, typed: string) => {
    const clubSide = clubSideFor(side)
    const letters = sideLettersOf(encounter, side)
    const seats = encounterLineupOf({ encounter, setup, side })
    const answer = licensees[side]

    return clubSide === null
      ? dayRosterOf({
          letters,
          players: dayPlayers().filter(
            (player) => player.teamId === encounter[side]
          ),
          seats,
          typed
        })
      : clubRosterOf({
          directory: clubSide.club.players,
          letters,
          licensees: answer?.status === 'ready' ? answer.data : null,
          players: dayPlayers(),
          seats,
          teamLineup: clubSide.team.lineup,
          typed
        })
  }

  /** Seats a roster's pick: a licensee straight from the FFTT joins the day under his own id, a typed player the FFTT knows brings its points. */
  const pickFor = (side: Side, index: number, pick: string | null) => {
    const lineup = encounterLineupOf({ encounter, setup, side })
    const seat = (playerId: PlayerId | null) =>
      change(side, seatLetter({ index, lineup, playerId }))

    if (pick === null) {
      seat(null)
      return
    }

    const answer = licensees[side]
    const fromFederation =
      answer?.status === 'ready' ? answer.data : ([] as const)
    const row = rosterOf(side, '')
      .flatMap((group) => group.rows)
      .find((candidate) => candidate.id === pick)
    const licensee = fromFederation.find(
      (player) => player.licence === (licenceOfPick(pick) ?? row?.licence)
    )

    if (licensee === undefined || row?.source !== 'fftt') {
      seat(pick)
      return
    }

    const known = dayPlayers().find(
      (player) =>
        player.teamId === encounter[side] &&
        (player.id === pick || player.licence === licensee.licence)
    )
    const id =
      licenceOfPick(pick) === null ? pick : (known?.id ?? newPlayerId())

    added.current.set(
      id,
      eventPlayerFromFederation({
        id,
        player: licensee,
        teamId: encounter[side]
      })
    )
    seat(id)
  }

  const noticeOf = (side: Side): RosterNotice | null => {
    const answer = licensees[side]

    return answer === null ||
      answer.status === 'ready' ||
      answer.status === 'off'
      ? null
      : answer.status
  }

  const lineupSideOf = (side: Side): LineupSide => {
    const clubSide = clubSideFor(side)
    const letters = sideLettersOf(encounter, side)
    const lineup = encounterLineupOf({ encounter, setup, side })
    const players = dayPlayers()

    return {
      addLabel: (typed) =>
        (
          clubSide === null
            ? typed.trim() === ''
            : splitTypedName(typed) === null
        )
          ? null
          : translate('organiser.pick.addPlayer', { name: typed.trim() }),
      clubName: clubSide?.club.name ?? null,
      colour: teamColourOf(event, encounter[side]),
      hasFederation: licensees[side]?.status === 'ready',
      letters,
      lineup,
      link:
        clubSide === null || clubSide.club.number !== null ? null : (
          <FederationLink
            club={clubSide.club}
            isOwn={record?.own.id === clubSide.club.id}
            onLink={(number) =>
              club.edit((current) =>
                linkFederationClub({
                  clubId: clubSide.club.id,
                  number,
                  record: current
                })
              )
            }
          />
        ),
      notice: noticeOf(side),
      onAdd: (typed) => addPlayerTo(side, typed),
      onChange: (next) => change(side, next),
      onPick: (index, pick) => pickFor(side, index, pick),
      roster: (typed) => rosterOf(side, typed),
      seated: lineup.map((playerId) => {
        const player = players.find((candidate) => candidate.id === playerId)

        return player === undefined
          ? null
          : { name: player.name, points: player.points }
      }),
      teamName: teamNameOf(side)
    }
  }

  const tableOf = (group: number) => {
    const table = tables.at(group)

    return table === undefined
      ? translate(
          group === 0
            ? 'organiser.encountersStep.theFirstTable'
            : 'organiser.encountersStep.theSecondTable'
        )
      : translate('organiser.encountersStep.theTable', { table })
  }
  const openingOf = (group: number) => {
    const opening = format.sheet.find(
      (sheetLine) =>
        sheetLine.group === group + 1 && sheetLine.kind === 'singles'
    )

    return opening?.kind === 'singles' ? `${opening.home}–${opening.away}` : ''
  }

  return (
    <div className='encounter-detail'>
      {line === undefined || startedMatchIds.size === 0 ? null : (
        <EncounterScore encounter={line} />
      )}
      <EncounterLineup
        away={lineupSideOf('away')}
        groupCount={format.groupCount}
        hint={
          format.groupCount === 1
            ? translate('organiser.encountersStep.orderOneTable', {
                count: format.sheet.length,
                first: openingOf(0)
              })
            : translate('organiser.encountersStep.orderTwoTables', {
                count: format.sheet.length,
                first: openingOf(0),
                firstTable: tableOf(0),
                second: openingOf(1),
                secondTable: tableOf(1)
              })
        }
        home={lineupSideOf('home')}
        tables={tables}
      />
      {SIDES.every((side) => clubSideFor(side) === null) ? null : (
        <Switch isSelected={keepsLineup} onChange={setKeepsLineup}>
          {translate('organiser.clubEncounter.keepLineup')}
        </Switch>
      )}
      <PlayerForfeit
        encounterId={encounter.id}
        matches={event.matches}
        onRecord={onRecord}
        setup={setup}
      />
    </div>
  )
}
