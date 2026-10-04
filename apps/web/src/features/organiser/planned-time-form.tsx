import type { Time } from '@internationalized/date'
import type React from 'react'
import { useState } from 'react'

import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'

import { atTimeOfDay, toTimeOfDay } from '@/infrastructure/dates'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { TimeField } from '@/presentation/components/time-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

type PlannedTimeFormProps = {
  /** Any instant on the event's day: an event is one day, so only the time is typed. */
  eventDay: InstantMs
  match: MatchView
  onPlan: (plannedAtMs: InstantMs | null) => void
}

/** The time the organiser wants a match played; empty leaves it to the queue. */
export const PlannedTimeForm: React.FC<PlannedTimeFormProps> = ({
  eventDay,
  match,
  onPlan
}) => {
  const translate = useTranslate()
  const [time, setTime] = useState<Time | null>(
    match.plannedAtMs === null ? null : toTimeOfDay(match.plannedAtMs)
  )

  return (
    <Form
      className='planned-time-form'
      onSubmit={(event) => {
        event.preventDefault()
        onPlan(time === null ? null : atTimeOfDay(time, eventDay))
      }}
    >
      <TimeField
        label={translate('organiser.matches.plannedAt')}
        onChange={setTime}
        value={time}
      />
      <Button type='submit' variant='quiet'>
        {translate('organiser.matches.plannedAtSave')}
      </Button>
    </Form>
  )
}
