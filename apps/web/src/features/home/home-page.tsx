import type React from 'react'
import { useState } from 'react'

import { tableTennisBestOfs } from '@scoreboard/protocol/match-format'

import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Main } from '@/presentation/components/main'
import { Group, NumberField } from '@/presentation/components/number-field'
import {
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectTrigger
} from '@/presentation/components/select'
import { Input, Label, TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { apiErrorKey } from '@/presentation/i18n/translation'

import { useCreateEvent } from './use-create-event'

const DEFAULT_TABLE_COUNT = 12
const DEFAULT_BEST_OF = 5
const POINTS_PER_GAME = 11

const isBestOf = (
  value: unknown
): value is (typeof tableTennisBestOfs)[number] =>
  tableTennisBestOfs.some((bestOf) => bestOf === value)

/** Opens a new event: its name, its tables and how matches are played. */
export const HomePage: React.FC = () => {
  const translate = useTranslate()
  const { create, state } = useCreateEvent()
  const [name, setName] = useState('')
  const [tableCount, setTableCount] = useState(DEFAULT_TABLE_COUNT)
  const [bestOf, setBestOf] =
    useState<(typeof tableTennisBestOfs)[number]>(DEFAULT_BEST_OF)

  return (
    <Main>
      <title>{translate('home.title')}</title>
      <h1>{translate('home.title')}</h1>
      <Form
        onSubmit={(event) => {
          event.preventDefault()
          void create({
            format: {
              bestOf,
              pointsPerGame: POINTS_PER_GAME,
              sport: 'table-tennis'
            },
            name,
            tableCount
          })
        }}
      >
        <TextField isRequired onChange={setName} value={name}>
          <Label>{translate('home.name')}</Label>
          <Input />
        </TextField>
        <NumberField
          maxValue={64}
          minValue={1}
          onChange={setTableCount}
          value={tableCount}
        >
          <Label>{translate('home.tableCount')}</Label>
          <Group>
            <Input />
          </Group>
        </NumberField>
        <Select
          onSelectionChange={(key) => {
            if (isBestOf(key)) {
              setBestOf(key)
            }
          }}
          selectedKey={bestOf}
        >
          <Label>{translate('home.bestOf')}</Label>
          <SelectTrigger />
          <Popover>
            <ListBox>
              {tableTennisBestOfs.map((count) => (
                <ListBoxItem id={count} key={count}>
                  {translate('home.bestOfOption', { count })}
                </ListBoxItem>
              ))}
            </ListBox>
          </Popover>
        </Select>
        <Button isDisabled={state.status === 'creating'} type='submit'>
          {translate('home.create')}
        </Button>
        {state.status === 'failed' ? (
          <p role='alert'>{translate(apiErrorKey(state.error))}</p>
        ) : null}
      </Form>
    </Main>
  )
}
