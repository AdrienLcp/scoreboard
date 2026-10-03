import type React from 'react'
import { useState } from 'react'

import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'

import { toLocalDateTime } from '@/infrastructure/dates'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Input, Label, TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { readTypedInstant } from './typed-instant'

type PlannedTimeFormProps = {
  match: MatchView
  onPlan: (plannedAtMs: InstantMs | null) => void
}

/** The time the organiser wants a match played; empty leaves it to the queue. */
export const PlannedTimeForm: React.FC<PlannedTimeFormProps> = ({
  match,
  onPlan
}) => {
  const translate = useTranslate()
  const [typed, setTyped] = useState(
    match.plannedAtMs === null ? '' : toLocalDateTime(match.plannedAtMs)
  )
  const plannedAtMs = readTypedInstant(typed)

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault()

        if (plannedAtMs !== 'invalid') {
          onPlan(plannedAtMs)
        }
      }}
    >
      <TextField
        isInvalid={plannedAtMs === 'invalid'}
        onChange={setTyped}
        value={typed}
      >
        <Label>{translate('organiser.matches.plannedAt')}</Label>
        <Input type='datetime-local' />
      </TextField>
      <Button isDisabled={plannedAtMs === 'invalid'} type='submit'>
        {translate('organiser.matches.plannedAtSave')}
      </Button>
    </Form>
  )
}
