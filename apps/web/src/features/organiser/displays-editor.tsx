import type React from 'react'
import { useState } from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type { EventId } from '@scoreboard/protocol/identifiers'

import { newId } from '@/infrastructure/ids'
import {
  displayOfPathFor,
  displayPathFor
} from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Icon } from '@/presentation/components/icon'
import { TextLink } from '@/presentation/components/link'
import { Group, NumberField } from '@/presentation/components/number-field'
import { Input, Label, TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { ConfirmButton } from './confirm-button'
import { addDisplay, removeDisplay, tableRange } from './setup-edits'

type DisplaysEditorProps = {
  eventId: EventId
  onSave: (setup: EventSetup) => void
  setup: EventSetup
}

/** Splits the tables across several screens, each with its own link. */
export const DisplaysEditor: React.FC<DisplaysEditorProps> = ({
  eventId,
  onSave,
  setup
}) => {
  const translate = useTranslate()
  const [name, setName] = useState('')
  const [firstTable, setFirstTable] = useState(1)
  const [lastTable, setLastTable] = useState(setup.tableCount)

  return (
    <div className='organiser-stack'>
      <ul className='organiser-list'>
        <li className='organiser-row'>
          <span className='organiser-row-text'>
            <b>{translate('organiser.displays.all')}</b>
            <small>{translate('organiser.displays.allTables')}</small>
          </span>
          <TextLink href={displayPathFor(eventId)} target='_blank'>
            {translate('organiser.displays.open')}
          </TextLink>
        </li>
        {setup.displays.map((display) => (
          <li className='organiser-row' key={display.id}>
            <span className='organiser-row-text'>
              <b>{display.name}</b>
              <small>
                {translate('encounter.tables', {
                  count: display.tables.length,
                  tables: display.tables.map(String)
                })}
              </small>
            </span>
            <TextLink
              href={displayOfPathFor({ displayId: display.id, eventId })}
              target='_blank'
            >
              {translate('organiser.displays.open')}
            </TextLink>
            <ConfirmButton
              confirmLabel={translate('organiser.displays.remove', {
                name: display.name
              })}
              label={translate('organiser.remove')}
              onConfirm={() => onSave(removeDisplay(setup, display.id))}
            />
          </li>
        ))}
      </ul>
      <Form
        className='organiser-panel organiser-inline-form'
        onSubmit={(event) => {
          event.preventDefault()
          onSave(
            addDisplay(setup, {
              id: newId(),
              name,
              tables: tableRange({ first: firstTable, last: lastTable })
            })
          )
          setName('')
        }}
      >
        <h3>{translate('organiser.displays.addTitle')}</h3>
        <TextField isRequired onChange={setName} value={name}>
          <Label>{translate('organiser.displays.name')}</Label>
          <Input
            placeholder={translate('organiser.displays.namePlaceholder')}
          />
        </TextField>
        <NumberField
          maxValue={setup.tableCount}
          minValue={1}
          onChange={setFirstTable}
          value={firstTable}
        >
          <Label>{translate('organiser.displays.first')}</Label>
          <Group>
            <Input />
          </Group>
        </NumberField>
        <NumberField
          maxValue={setup.tableCount}
          minValue={firstTable}
          onChange={setLastTable}
          value={lastTable}
        >
          <Label>{translate('organiser.displays.last')}</Label>
          <Group>
            <Input />
          </Group>
        </NumberField>
        <Button type='submit'>
          <Icon name='plus' />
          {translate('organiser.displays.add')}
        </Button>
      </Form>
    </div>
  )
}
