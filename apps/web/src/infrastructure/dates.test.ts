import { Time } from '@internationalized/date'
import { describe, expect, it } from 'vitest'

import type { InstantMs } from '@scoreboard/protocol/scoring-event'

import {
  atTimeOfDay,
  parseLocalDateTime,
  toLocalDateTime,
  toTimeOfDay
} from './dates'

const localInstant = (text: string): InstantMs => {
  const parsed = parseLocalDateTime(text)

  if (parsed.status !== 'success') {
    throw new Error(`Unreadable test instant: ${text}`)
  }

  return parsed.data
}

describe('time of day', () => {
  const eventDay = localInstant('2026-10-04T09:30')

  it('places a typed time on the event day', () => {
    expect(atTimeOfDay(new Time(14, 5), eventDay)).toBe(
      localInstant('2026-10-04T14:05')
    )
  })

  it('reads back the time it was given', () => {
    const planned = atTimeOfDay(new Time(18, 45), eventDay)

    expect(toTimeOfDay(planned).toString()).toBe('18:45:00')
  })
})

describe('datetime-local field', () => {
  it('[dates] shows back the minute it read', () => {
    expect(toLocalDateTime(localInstant('2026-10-04T09:30'))).toBe(
      '2026-10-04T09:30:00'
    )
  })

  it('[dates] refuses a day the calendar does not have', () => {
    expect(parseLocalDateTime('2026-02-31T10:00').status).toBe('failure')
  })

  it('[dates] refuses text that is not a local date and time', () => {
    expect(parseLocalDateTime('tomorrow').status).toBe('failure')
  })
})
