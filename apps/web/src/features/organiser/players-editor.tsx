import type React from 'react'
import { useState } from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'

import { newId } from '@/infrastructure/ids'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Input, Label, TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { ChoiceField } from './choice-field'
import { addPlayer, addTeam, removePlayer } from './setup-edits'

type PlayersEditorProps = {
  onSave: (setup: EventSetup) => void
  setup: EventSetup
}

/** The players and teams of the event. */
export const PlayersEditor: React.FC<PlayersEditorProps> = ({
  onSave,
  setup
}) => {
  const translate = useTranslate()
  const [playerName, setPlayerName] = useState('')
  const [teamId, setTeamId] = useState<string | null>(null)
  const [teamName, setTeamName] = useState('')

  const teamChoices = setup.teams.map((team) => ({
    id: team.id,
    label: team.name
  }))

  return (
    <>
      <ul>
        {setup.players.map((player) => (
          <li key={player.id}>
            {player.name}
            {player.teamId === null
              ? null
              : ` · ${setup.teams.find((team) => team.id === player.teamId)?.name ?? ''}`}{' '}
            <Button onPress={() => onSave(removePlayer(setup, player.id))}>
              {translate('organiser.players.remove', { name: player.name })}
            </Button>
          </li>
        ))}
      </ul>
      <Form
        onSubmit={(event) => {
          event.preventDefault()
          onSave(addPlayer(setup, { id: newId(), name: playerName, teamId }))
          setPlayerName('')
        }}
      >
        <TextField isRequired onChange={setPlayerName} value={playerName}>
          <Label>{translate('organiser.players.name')}</Label>
          <Input />
        </TextField>
        {teamChoices.length === 0 ? null : (
          <ChoiceField
            choices={teamChoices}
            label={translate('organiser.players.team')}
            onChange={setTeamId}
            selectedId={teamId}
          />
        )}
        <Button type='submit'>{translate('organiser.players.add')}</Button>
      </Form>
      <Form
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
        <Button type='submit'>{translate('organiser.teams.add')}</Button>
      </Form>
    </>
  )
}
