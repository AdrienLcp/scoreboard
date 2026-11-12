import type React from 'react'
import { useState } from 'react'

import type {
  ClubRecord,
  DirectoryClub,
  DirectoryPlayer,
  DirectoryTeam
} from '@scoreboard/protocol/club-record'
import type { EventSetup, Player, Team } from '@scoreboard/protocol/event-setup'
import type { PlayerId, TeamId } from '@scoreboard/protocol/identifiers'

import {
  addTypedOpponentTeam,
  addTypedPlayer
} from '@/features/club/club-edits'
import { byRecentThenName, familyFirst } from '@/features/club/directory-search'
import { type Pick, PickField } from '@/features/club/pick-field'
import { useClub } from '@/features/club/use-club'
import { useClubTranslate } from '@/features/club/use-club-translate'
import {
  newDirectoryClubId,
  newPlayerId,
  newTeamId
} from '@/infrastructure/ids'

import { ChoiceField } from './choice-field'
import { ConfirmButton } from './confirm-button'
import { addPlayer, addTeam, removePlayer } from './setup-edits'

type PlayersEditorProps = {
  onSave: (setup: EventSetup) => void
  setup: EventSetup
}

const NO_TEAM = 'none'

const fullNameOf = (player: DirectoryPlayer): string =>
  `${player.firstName} ${player.lastName}`

/** The club's own licensees first, then the opponents' most recently played; each with his club. */
const playerPicksOf = (
  record: ClubRecord | null,
  setup: EventSetup
): Pick[] => {
  const inEvent = new Set(setup.players.map((player) => player.id))
  const picksOf = (club: DirectoryClub) =>
    club.players
      .filter((player) => !inEvent.has(player.id))
      .toSorted(byRecentThenName(familyFirst))
      .map((player) => ({
        detail: club.name,
        id: player.id,
        label: fullNameOf(player)
      }))

  return record === null
    ? []
    : [record.own, ...record.opponents].flatMap(picksOf)
}

/** Our teams first, in their order, then the opposing ones most recently met. */
const teamPicksOf = (record: ClubRecord | null, setup: EventSetup): Pick[] => {
  if (record === null) {
    return []
  }

  const inEvent = new Set(setup.teams.map((team) => team.id))
  const opposing = record.opponents
    .flatMap((club) => club.teams.map((team) => ({ club, team })))
    .toSorted(byRecentThenName((entry: { team: DirectoryTeam }) => entry.team))

  return [
    ...record.own.teams.map((team) => ({ club: record.own, team })),
    ...opposing
  ]
    .filter(({ team }) => !inEvent.has(team.id))
    .map(({ club, team }) => ({
      detail: club.name,
      id: team.id,
      label: team.name
    }))
}

/** The directory's licensee as a player of the day. */
const directoryPlayerOf = (
  record: ClubRecord,
  playerId: PlayerId,
  teamId: TeamId | null
): Player | null => {
  const player = [record.own, ...record.opponents]
    .flatMap((club) => club.players)
    .find((candidate) => candidate.id === playerId)

  return player === undefined
    ? null
    : {
        id: player.id,
        licence: player.licence,
        name: fullNameOf(player),
        points: player.points,
        teamId
      }
}

/** The directory's team as a team of the day, in its colour and its club's logo. */
const directoryTeamOf = (record: ClubRecord, teamId: TeamId): Team | null => {
  const club = [record.own, ...record.opponents].find((candidate) =>
    candidate.teams.some((team) => team.id === teamId)
  )
  const team = club?.teams.find((candidate) => candidate.id === teamId)

  return club === undefined || team === undefined
    ? null
    : {
        colour: team.colour,
        id: team.id,
        logoUrl: club.logoUrl,
        name: team.name
      }
}

/**
 * The players and teams of the event, picked from the club's directory by
 * their first letters; a name the directory lacks is typed once, and kept in
 * it when its club is known.
 */
export const PlayersEditor: React.FC<PlayersEditorProps> = ({
  onSave,
  setup
}) => {
  const translate = useClubTranslate()
  const club = useClub()
  const record = club.state.status === 'ready' ? club.state.record : null
  const [teamId, setTeamId] = useState<string>(NO_TEAM)
  const pickedTeamId = teamId === NO_TEAM ? null : teamId
  /** The directory club of the team the new players join, when it has one. */
  const clubOfTeam =
    record === null || pickedTeamId === null
      ? null
      : ([record.own, ...record.opponents].find((candidate) =>
          candidate.teams.some((team) => team.id === pickedTeamId)
        ) ?? null)

  const addPlayerNamed = (typed: string) => {
    const added =
      record === null || clubOfTeam === null
        ? null
        : addTypedPlayer({
            clubId: clubOfTeam.id,
            newPlayerId,
            record,
            typed
          })

    if (added !== null) {
      club.change(added.record)
    }

    onSave(
      addPlayer(setup, {
        id: added?.playerId ?? newPlayerId(),
        licence: null,
        name: typed.trim(),
        points: null,
        teamId: pickedTeamId
      })
    )

    return null
  }

  const addTeamNamed = (typed: string) => {
    const added =
      record === null
        ? null
        : addTypedOpponentTeam({
            newClubId: newDirectoryClubId,
            newTeamId,
            record,
            typed
          })

    if (added !== null) {
      club.change(added.record)
    }

    onSave(
      addTeam(setup, {
        colour: record?.opponentColour ?? null,
        id: added?.teamId ?? newTeamId(),
        name: typed.trim()
      })
    )

    return null
  }

  const teamChoices = [
    { id: NO_TEAM, label: translate('organiser.players.noTeam') },
    ...setup.teams.map((team) => ({ id: team.id, label: team.name }))
  ]
  const teamNameOf = (id: string | null): string | null =>
    setup.teams.find((team) => team.id === id)?.name ?? null

  return (
    <div className='organiser-columns'>
      <section className='organiser-stack'>
        <h3 className='organiser-subheading'>
          {translate('organiser.players.count', {
            count: setup.players.length
          })}
        </h3>
        <div className='organiser-panel organiser-inline-form'>
          {setup.teams.length === 0 ? null : (
            <ChoiceField
              choices={teamChoices}
              label={translate('organiser.players.team')}
              onChange={(id) => setTeamId(id ?? NO_TEAM)}
              selectedId={teamId}
            />
          )}
          <PickField
            addLabel={(typed) =>
              translate('organiser.pick.addPlayer', { name: typed.trim() })
            }
            emptyLabel={(typed) => translate('organiser.pick.none', { typed })}
            label={translate('organiser.players.name')}
            onAdd={addPlayerNamed}
            onChange={(playerId) => {
              const player =
                record === null || playerId === null
                  ? null
                  : directoryPlayerOf(record, playerId, pickedTeamId)

              if (player !== null) {
                onSave(addPlayer(setup, player))
              }
            }}
            picks={playerPicksOf(record, setup)}
            placeholder={translate('organiser.pick.playerPlaceholder')}
            selectedId={null}
          />
        </div>
        {setup.players.length === 0 ? (
          <p className='organiser-empty'>
            {translate('organiser.players.empty')}
          </p>
        ) : (
          <ul className='organiser-list'>
            {setup.players.map((player) => (
              <li className='organiser-row' key={player.id}>
                <span className='organiser-row-text'>
                  <b>{player.name}</b>
                  {teamNameOf(player.teamId) === null ? null : (
                    <small>{teamNameOf(player.teamId)}</small>
                  )}
                </span>
                <ConfirmButton
                  confirmLabel={translate('organiser.players.remove', {
                    name: player.name
                  })}
                  label={translate('organiser.remove')}
                  onConfirm={() => onSave(removePlayer(setup, player.id))}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className='organiser-stack'>
        <h3 className='organiser-subheading'>
          {translate('organiser.teams.count', { count: setup.teams.length })}
        </h3>
        <div className='organiser-panel organiser-inline-form'>
          <PickField
            addLabel={(typed) =>
              translate('organiser.pick.addTeam', { name: typed.trim() })
            }
            emptyLabel={(typed) => translate('organiser.pick.none', { typed })}
            label={translate('organiser.teams.name')}
            onAdd={addTeamNamed}
            onChange={(id) => {
              const team =
                record === null || id === null
                  ? null
                  : directoryTeamOf(record, id)

              if (team !== null) {
                onSave(addTeam(setup, team))
              }
            }}
            picks={teamPicksOf(record, setup)}
            placeholder={translate('organiser.pick.teamPlaceholder')}
            selectedId={null}
          />
        </div>
        {setup.teams.length === 0 ? (
          <p className='organiser-empty'>
            {translate('organiser.teams.empty')}
          </p>
        ) : (
          <ul className='organiser-list'>
            {setup.teams.map((team) => (
              <li className='organiser-row' key={team.id}>
                <span className='organiser-row-text'>
                  <b>{team.name}</b>
                  <small>
                    {translate('organiser.teams.members', {
                      count: setup.players.filter(
                        (player) => player.teamId === team.id
                      ).length
                    })}
                  </small>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
