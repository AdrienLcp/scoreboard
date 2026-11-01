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

import { addTypedPlayer, keepLineup } from '@/features/club/club-edits'
import { clubSideOf } from '@/features/club/club-teams'
import {
  byRecentThenName,
  familyFirst,
  splitTypedName
} from '@/features/club/directory-search'
import type { Pick } from '@/features/club/pick-field'
import { useClub } from '@/features/club/use-club'
import { encounterLinesFor } from '@/features/event/encounter-lines'
import { EncounterScore } from '@/features/event/encounter-score'
import { newPlayerId } from '@/infrastructure/ids'
import { Switch } from '@/presentation/components/switch'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { EncounterLineup, type LineupSide } from './encounter-lineup'
import {
  encounterLineupOf,
  eventPlayerFrom,
  sideLettersOf,
  withEncounterLineup
} from './encounter-lineups'
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

type Candidate = { id: PlayerId; name: string; points: number | null }

/** The club's players first by the team's last composition, then the most recently played. */
const clubCandidatesOf = (side: ClubSide): Candidate[] => {
  const rankOf = (playerId: PlayerId) => {
    const seat = side.team.lineup.indexOf(playerId)

    return seat === -1 ? side.team.lineup.length : seat
  }

  return side.club.players
    .toSorted(
      (one, other) =>
        rankOf(one.id) - rankOf(other.id) ||
        byRecentThenName(familyFirst)(one, other)
    )
    .map((player) => ({
      id: player.id,
      name: `${player.firstName} ${player.lastName}`,
      points: player.points
    }))
}

/** Each candidate with the letter he already holds today and his ranking points. */
const picksOf = ({
  candidates,
  letters,
  lineup
}: {
  candidates: readonly Candidate[]
  letters: readonly string[]
  lineup: readonly (PlayerId | null)[]
}): Pick[] =>
  candidates.map((candidate) => {
    const seat = lineup.indexOf(candidate.id)
    const detail = [
      seat === -1 ? null : letters.at(seat),
      candidate.points === null ? null : String(candidate.points)
    ]
      .filter((part) => part != null)
      .join(' · ')

    return {
      detail: detail === '' ? undefined : detail,
      id: candidate.id,
      label: candidate.name
    }
  })

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
      club.edit((current) =>
        keepLineup({ lineup, record: current, teamId: clubSide.team.id })
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

  const lineupSideOf = (side: Side): LineupSide => {
    const clubSide = clubSideFor(side)
    const letters = sideLettersOf(encounter, side)
    const lineup = encounterLineupOf({ encounter, setup, side })
    const candidates =
      clubSide === null
        ? setup.players
            .filter((player) => player.teamId === encounter[side])
            .map((player) => ({
              id: player.id,
              name: player.name,
              points: player.points
            }))
        : clubCandidatesOf(clubSide)

    return {
      addLabel: (typed) =>
        (
          clubSide === null
            ? typed.trim() === ''
            : splitTypedName(typed) === null
        )
          ? null
          : translate('organiser.pick.addPlayer', { name: typed.trim() }),
      colour: teamColourOf(event, encounter[side]),
      emptyLabel: (typed) =>
        clubSide === null
          ? translate('organiser.pick.none', { typed })
          : translate('organiser.pick.fullName', { typed }),
      letters,
      lineup,
      onAdd: (typed) => addPlayerTo(side, typed),
      onChange: (next) => change(side, next),
      picks: picksOf({ candidates, letters, lineup }),
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
