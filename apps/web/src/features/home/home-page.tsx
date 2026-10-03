import type React from 'react'
import { useState } from 'react'

import { eventIdSchema } from '@scoreboard/protocol/identifiers'
import { tableTennisBestOfs } from '@scoreboard/protocol/match-format'

import {
  spectatorPathFor,
  umpireEntryPathFor,
  useNavigateTo
} from '@/infrastructure/router/navigation'
import { BrandMark } from '@/presentation/components/brand-mark'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Icon } from '@/presentation/components/icon'
import { Main } from '@/presentation/components/main'
import { Group, NumberField } from '@/presentation/components/number-field'
import {
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectTrigger
} from '@/presentation/components/select'
import {
  Description,
  FieldError,
  Input,
  Label,
  TextField
} from '@/presentation/components/text-field'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { apiErrorKey } from '@/presentation/i18n/translation'

import { useCreateEvent } from './use-create-event'

import './home-page.sass'

const DEFAULT_TABLE_COUNT = 12
const DEFAULT_BEST_OF = 5
const POINTS_PER_GAME = 11

type BestOf = (typeof tableTennisBestOfs)[number]

const isBestOf = (value: unknown): value is BestOf =>
  tableTennisBestOfs.some((bestOf) => bestOf === value)

/** An event link pasted whole works as well as its code alone. */
const eventCodeIn = (typed: string): string =>
  typed.trim().split('/e/').at(-1)?.split(/[/?#]/)[0]?.toLowerCase() ?? ''

const CreateEventForm: React.FC = () => {
  const translate = useTranslate()
  const { create, state } = useCreateEvent()
  const [name, setName] = useState('')
  const [tableCount, setTableCount] = useState(DEFAULT_TABLE_COUNT)
  const [bestOf, setBestOf] = useState<BestOf>(DEFAULT_BEST_OF)

  return (
    <Form
      className='home-card home-create'
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
      <h2>{translate('home.title')}</h2>
      <TextField isRequired onChange={setName} value={name}>
        <Label>{translate('home.name')}</Label>
        <Input placeholder={translate('home.namePlaceholder')} />
      </TextField>
      <div className='home-pair'>
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
      </div>
      <Button
        isDisabled={state.status === 'creating'}
        type='submit'
        variant='primary'
      >
        {translate(
          state.status === 'creating' ? 'home.creating' : 'home.create'
        )}
      </Button>
      {state.status === 'failed' ? (
        <p className='home-error' role='alert'>
          <Icon name='alert' />
          {translate(apiErrorKey(state.error))}
        </p>
      ) : (
        <p className='home-note'>{translate('home.createNote')}</p>
      )}
    </Form>
  )
}

const JoinEventForm: React.FC = () => {
  const translate = useTranslate()
  const navigateTo = useNavigateTo()
  const [typed, setTyped] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const eventId = eventIdSchema.safeParse(eventCodeIn(typed))
  const goTo = (pathFor: (id: string) => string) => {
    setIsSubmitted(true)

    if (eventId.success) {
      navigateTo(pathFor(eventId.data))
    }
  }

  return (
    <Form
      className='home-card home-join'
      onSubmit={(event) => {
        event.preventDefault()
        goTo(spectatorPathFor)
      }}
    >
      <h2>{translate('home.join.title')}</h2>
      <TextField
        isInvalid={isSubmitted && !eventId.success}
        onChange={(value) => {
          setTyped(value)
          setIsSubmitted(false)
        }}
        value={typed}
      >
        <Label>{translate('home.join.code')}</Label>
        <Input
          autoComplete='off'
          className='home-join-input'
          spellCheck={false}
        />
        <Description>{translate('home.join.hint')}</Description>
        <FieldError>
          <Icon name='alert' />
          {translate('home.join.invalid')}
        </FieldError>
      </TextField>
      <div className='home-join-actions'>
        <Button type='submit'>{translate('home.join.follow')}</Button>
        <Button onPress={() => goTo(umpireEntryPathFor)}>
          {translate('home.join.umpire')}
        </Button>
      </div>
    </Form>
  )
}

/** The way in: open a new event, or join one by its code. */
export const HomePage: React.FC = () => {
  const translate = useTranslate()

  return (
    <Main className='home-page'>
      <DocumentTitle>{translate('app.name')}</DocumentTitle>
      <header className='home-bar'>
        <BrandMark />
      </header>
      <div className='home-intro'>
        <h1>{translate('home.headline')}</h1>
        <p>{translate('home.lead')}</p>
      </div>
      <div className='home-forms'>
        <CreateEventForm />
        <JoinEventForm />
      </div>
    </Main>
  )
}
