import type React from 'react'
import { useState } from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'

import { newId } from '@/infrastructure/ids'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Icon } from '@/presentation/components/icon'
import { Input, Label, TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { ChoiceField } from './choice-field'
import { ConfirmButton } from './confirm-button'
import { addPlayer, addTeam, removePlayer } from './setup-edits'

type PlayersEditorProps = {
  onSave: (setup: EventSetup) => void
  setup: EventSetup
}

const NO_TEAM = 'none'

/** The players and teams of the event. */
export const PlayersEditor: React.FC<PlayersEditorProps> = ({
  onSave,
  setup
}) => {
  const translate = useTranslate()
  const [playerName, setPlayerName] = useState('')
  const [teamId, setTeamId] = useState<string>(NO_TEAM)
  const [teamName, setTeamName] = useState('')

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
        <Form
          className='organiser-panel organiser-inline-form'
          onSubmit={(event) => {
            event.preventDefault()
            onSave(
              addPlayer(setup, {
                id: newId(),
                name: playerName,
                teamId: teamId === NO_TEAM ? null : teamId
              })
            )
            setPlayerName('')
          }}
        >
          <TextField isRequired onChange={setPlayerName} value={playerName}>
            <Label>{translate('organiser.players.name')}</Label>
            <Input />
          </TextField>
          {setup.teams.length === 0 ? null : (
            <ChoiceField
              choices={teamChoices}
              label={translate('organiser.players.team')}
              onChange={(id) => setTeamId(id ?? NO_TEAM)}
              selectedId={teamId}
            />
          )}
          <Button type='submit'>
            <Icon name='plus' />
            {translate('organiser.players.add')}
          </Button>
        </Form>
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
        <Form
          className='organiser-panel organiser-inline-form'
          onSubmit={(event) => {
            event.preventDefault()
            onSave(addTeam(setup, { id: newId(), name: teamName }))
            setTeamName('')
          }}
        >
          <TextField isRequired onChange={setTeamName} value={teamName}>
            <Label>{translate('organiser.teams.name')}</Label>
            <Input />
          </TextField>
          <Button type='submit'>
            <Icon name='plus' />
            {translate('organiser.teams.add')}
          </Button>
        </Form>
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
