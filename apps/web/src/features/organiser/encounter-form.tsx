import type React from 'react'
import { useState } from 'react'

import {
  type EncounterFormatId,
  encounterFormatIds
} from '@scoreboard/protocol/encounter-format-id'
import type { EventSetup } from '@scoreboard/protocol/event-setup'

import { encounterFormatFor } from '@scoreboard/core/encounter/encounter-formats'
import type { Lineup } from '@scoreboard/core/encounter/encounter-sheet'

import { newId } from '@/infrastructure/ids'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { encounterFormatKey } from '@/presentation/i18n/translation'

import { ChoiceField } from './choice-field'
import { addEncounter } from './setup-edits'

type EncounterFormProps = {
  onSave: (setup: EventSetup) => void
  setup: EventSetup
}

const isEncounterFormatId = (id: string | null): id is EncounterFormatId =>
  encounterFormatIds.some((formatId) => formatId === id)

/** A team encounter: two teams, a federation sheet, and who holds each letter. */
export const EncounterForm: React.FC<EncounterFormProps> = ({
  onSave,
  setup
}) => {
  const translate = useTranslate()
  const [formatId, setFormatId] = useState<EncounterFormatId>(
    encounterFormatIds[0]
  )
  const [homeTeamId, setHomeTeamId] = useState<string | null>(null)
  const [awayTeamId, setAwayTeamId] = useState<string | null>(null)
  const [lineups, setLineups] = useState<{ away: Lineup; home: Lineup }>({
    away: {},
    home: {}
  })

  const format = encounterFormatFor(formatId)
  const teamChoices = setup.teams.map((team) => ({
    id: team.id,
    label: team.name
  }))
  const playersOf = (teamId: string | null) =>
    setup.players
      .filter((player) => player.teamId === teamId)
      .map((player) => ({ id: player.id, label: player.name }))

  const letterFields = (side: 'home' | 'away', teamId: string | null) =>
    (side === 'home' ? format.homeLetters : format.awayLetters).map(
      (letter) => (
        <ChoiceField
          choices={playersOf(teamId)}
          key={letter}
          label={letter}
          onChange={(playerId) =>
            setLineups((current) => ({
              ...current,
              [side]: { ...current[side], [letter]: playerId ?? undefined }
            }))
          }
          selectedId={lineups[side][letter] ?? null}
        />
      )
    )

  return (
    <Form
      className='organiser-panel encounter-form'
      onSubmit={(event) => {
        event.preventDefault()

        if (homeTeamId === null || awayTeamId === null) {
          return
        }

        onSave(
          addEncounter({
            encounter: {
              away: awayTeamId,
              formatId,
              home: homeTeamId,
              id: newId()
            },
            lineups,
            newMatchId: newId,
            setup
          })
        )
      }}
    >
      <ChoiceField
        choices={encounterFormatIds.map((id) => ({
          id,
          label: translate(encounterFormatKey(id))
        }))}
        label={translate('organiser.encounter.format')}
        onChange={(id) => {
          if (isEncounterFormatId(id)) {
            setFormatId(id)
          }
        }}
        selectedId={formatId}
      />
      <ChoiceField
        choices={teamChoices}
        label={translate('organiser.encounter.home')}
        onChange={setHomeTeamId}
        selectedId={homeTeamId}
      />
      <div className='encounter-letters'>
        {letterFields('home', homeTeamId)}
      </div>
      <ChoiceField
        choices={teamChoices}
        label={translate('organiser.encounter.away')}
        onChange={setAwayTeamId}
        selectedId={awayTeamId}
      />
      <div className='encounter-letters'>
        {letterFields('away', awayTeamId)}
      </div>
      <Button
        isDisabled={
          homeTeamId === null ||
          awayTeamId === null ||
          homeTeamId === awayTeamId
        }
        type='submit'
      >
        <Icon name='plus' />
        {translate('organiser.encounter.add')}
      </Button>
    </Form>
  )
}
