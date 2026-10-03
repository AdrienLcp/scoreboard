import type React from 'react'
import { useState } from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import { MAX_TABLES } from '@scoreboard/protocol/identifiers'

import { toLocalDateTime } from '@/infrastructure/dates'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Group, NumberField } from '@/presentation/components/number-field'
import { Input, Label, TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { changeTableCount } from './setup-edits'
import { readTypedInstant } from './typed-instant'

type EventSettingsFormProps = {
  onSave: (setup: EventSetup) => void
  setup: EventSetup
}

/** The event's name, its club and how many tables it plays on. */
export const EventSettingsForm: React.FC<EventSettingsFormProps> = ({
  onSave,
  setup
}) => {
  const translate = useTranslate()
  const [name, setName] = useState(setup.name)
  const [clubName, setClubName] = useState(setup.club?.name ?? '')
  const [tableCount, setTableCount] = useState(setup.tableCount)
  const [startsAt, setStartsAt] = useState(
    setup.startsAtMs === null ? '' : toLocalDateTime(setup.startsAtMs)
  )
  const startsAtMs = readTypedInstant(startsAt)

  return (
    <Form
      className='organiser-panel settings-form'
      onSubmit={(event) => {
        event.preventDefault()

        if (startsAtMs === 'invalid') {
          return
        }

        const trimmedClubName = clubName.trim()

        onSave({
          ...changeTableCount(setup, tableCount),
          club:
            trimmedClubName === ''
              ? null
              : {
                  colours: setup.club?.colours ?? null,
                  logoUrl: setup.club?.logoUrl ?? null,
                  name: trimmedClubName
                },
          name,
          startsAtMs
        })
      }}
    >
      <TextField isRequired onChange={setName} value={name}>
        <Label>{translate('organiser.settings.name')}</Label>
        <Input />
      </TextField>
      <TextField onChange={setClubName} value={clubName}>
        <Label>{translate('organiser.settings.club')}</Label>
        <Input />
      </TextField>
      <TextField
        isInvalid={startsAtMs === 'invalid'}
        onChange={setStartsAt}
        value={startsAt}
      >
        <Label>{translate('organiser.settings.startsAt')}</Label>
        <Input type='datetime-local' />
      </TextField>
      <NumberField
        maxValue={MAX_TABLES}
        minValue={1}
        onChange={setTableCount}
        value={tableCount}
      >
        <Label>{translate('organiser.settings.tableCount')}</Label>
        <Group>
          <Input />
        </Group>
      </NumberField>
      <Button className='settings-save' type='submit' variant='primary'>
        {translate('organiser.save')}
      </Button>
    </Form>
  )
}
