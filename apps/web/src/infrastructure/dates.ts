import { Result } from '@adrienlcp/result'
import {
  fromAbsolute,
  getLocalTimeZone,
  parseDateTime,
  type Time,
  toCalendarDate,
  toCalendarDateTime,
  toTime
} from '@internationalized/date'

import type { InstantMs } from '@scoreboard/protocol/scoring-event'

const onThisDevice = (instant: InstantMs) =>
  fromAbsolute(instant, getLocalTimeZone())

/**
 * What a `datetime-local` field holds, `YYYY-MM-DDTHH:mm`, read on this
 * device's wall clock: the organiser types the time of their own hall.
 */
export const parseLocalDateTime = (
  text: string
): Result<InstantMs, 'invalid'> => {
  try {
    return Result.success(
      parseDateTime(text).toDate(getLocalTimeZone()).getTime()
    )
  } catch {
    return Result.failure('invalid')
  }
}

/** The value a `datetime-local` field shows for an instant, on this device's wall clock. */
export const toLocalDateTime = (instant: InstantMs): string =>
  toCalendarDateTime(onThisDevice(instant))
    .set({ millisecond: 0, second: 0 })
    .toString()

/** `Intl` formats a `Date`: this is where an instant becomes one. */
export const toDate = (instant: InstantMs): Date => new Date(instant)

/** The wall-clock time of day of an instant, on this device. */
export const toTimeOfDay = (instant: InstantMs): Time =>
  toTime(onThisDevice(instant)).set({ millisecond: 0, second: 0 })

/** The instant a time of day falls on, on the same local day as `day`. */
export const atTimeOfDay = (time: Time, day: InstantMs): InstantMs =>
  toCalendarDateTime(toCalendarDate(onThisDevice(day)), time)
    .toDate(getLocalTimeZone())
    .getTime()
