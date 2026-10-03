import { Result } from '@adrienlcp/result'

import type { InstantMs } from '@scoreboard/protocol/scoring-event'

const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

const pad = (value: number): string => String(value).padStart(2, '0')

/**
 * What a `datetime-local` field holds, `YYYY-MM-DDTHH:mm`, read on this
 * device's wall clock: the organiser types the time of their own hall.
 */
export const parseLocalDateTime = (
  text: string
): Result<InstantMs, 'invalid'> => {
  if (!LOCAL_DATE_TIME.test(text)) {
    return Result.failure('invalid')
  }

  const instant = new Date(text).getTime()

  return Number.isNaN(instant)
    ? Result.failure('invalid')
    : Result.success(instant)
}

/** The value a `datetime-local` field shows for an instant, on this device's wall clock. */
export const toLocalDateTime = (instant: InstantMs): string => {
  const date = new Date(instant)
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

  return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** `Intl` formats a `Date`: this is where an instant becomes one. */
export const toDate = (instant: InstantMs): Date => new Date(instant)
