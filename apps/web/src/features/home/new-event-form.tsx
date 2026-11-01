import type React from 'react'
import { useState } from 'react'

import type { ClubRecord } from '@scoreboard/protocol/club-record'

import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Icon } from '@/presentation/components/icon'
import { Input, Label, TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-context'
import { apiErrorKey } from '@/presentation/i18n/translation'

import { eventInputFor } from './club-day'
import { useDefaultPlanName } from './default-plan-name'
import { useCreateEvent } from './use-create-event'

type NewEventFormProps = {
  /** Opened from a button: the name is typed at once. */
  autoFocus?: boolean
  /** The page's main action: its button stands under the field, as the primary one. */
  isMain?: boolean
  record: ClubRecord | null
}

/** A new event asks only its name: the club's default plan or eight tables, three games to win, all changed later. */
export const NewEventForm: React.FC<NewEventFormProps> = ({
  autoFocus = false,
  isMain = false,
  record
}) => {
  const translate = useTranslate()
  const { create, state } = useCreateEvent()
  const [name, setName] = useState('')
  const planName = useDefaultPlanName(record)

  return (
    <Form
      className='home-new-event'
      data-main={isMain || undefined}
      onSubmit={(event) => {
        event.preventDefault()
        void create(eventInputFor({ name, record }))
      }}
    >
      <div className='home-inline-field'>
        <TextField
          autoFocus={autoFocus}
          isRequired
          onChange={setName}
          value={name}
        >
          <Label>{translate('home.events.name')}</Label>
          <Input
            autoComplete='off'
            placeholder={translate('home.events.namePlaceholder')}
          />
        </TextField>
        <Button
          isPending={state.status === 'creating'}
          type='submit'
          variant={isMain ? 'primary' : 'secondary'}
        >
          {translate('home.create')}
        </Button>
      </div>
      {state.status === 'failed' ? (
        <p className='home-alert' role='alert'>
          <Icon name='alert' />
          {translate(apiErrorKey(state.error))}
        </p>
      ) : (
        <p className='home-hint'>
          {translate('home.events.note', { plan: planName })}
        </p>
      )}
    </Form>
  )
}
