import type React from 'react'
import { useState } from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type { EventId } from '@scoreboard/protocol/identifiers'

import { newId } from '@/infrastructure/ids'
import { displayOfPathFor } from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Link } from '@/presentation/components/link'
import { Group, NumberField } from '@/presentation/components/number-field'
import { Input, Label, TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

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
    <>
      <ul>
        {setup.displays.map((display) => (
          <li key={display.id}>
            <Link href={displayOfPathFor({ displayId: display.id, eventId })}>
              {display.name}
            </Link>{' '}
            {translate('organiser.displays.tables', {
              tables: display.tables.map(String)
            })}{' '}
            <Button onPress={() => onSave(removeDisplay(setup, display.id))}>
              {translate('organiser.displays.remove', { name: display.name })}
            </Button>
          </li>
        ))}
      </ul>
      <Form
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
        <TextField isRequired onChange={setName} value={name}>
          <Label>{translate('organiser.displays.name')}</Label>
          <Input />
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
        <Button type='submit'>{translate('organiser.displays.add')}</Button>
      </Form>
    </>
  )
}
