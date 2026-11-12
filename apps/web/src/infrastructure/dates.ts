import { Result } from '@adrienlcp/result'
import {
  fromAbsolute,
  getLocalTimeZone,
  parseDate,
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

/** The day an instant falls on, `YYYY-MM-DD`, on this device's calendar. */
export const toLocalDay = (instant: InstantMs): string =>
  toCalendarDate(onThisDevice(instant)).toString()

/** The wall-clock time of day of an instant, on this device. */
export const toTimeOfDay = (instant: InstantMs): Time =>
  toTime(onThisDevice(instant)).set({ millisecond: 0, second: 0 })

/** The instant a time of day falls on, on the same local day as `day`. */
export const atTimeOfDay = (time: Time, day: InstantMs): InstantMs =>
  toCalendarDateTime(toCalendarDate(onThisDevice(day)), time)
    .toDate(getLocalTimeZone())
    .getTime()

/** The same weekday some weeks after a `YYYY-MM-DD` day: a calendar's next round. */
export const dayWeeksAfter = (day: string, weeks: number): string =>
  parseDate(day).add({ weeks }).toString()

/** A `YYYY-MM-DD` day at midnight on this device, for `Intl` to name it. */
export const dayAsDate = (day: string): Date =>
  parseDate(day).toDate(getLocalTimeZone())

/** Whether a `YYYY-MM-DD` day falls within some days either side of another. */
export const isWithinDaysOf = ({
  day,
  days,
  of
}: {
  day: string
  days: number
  of: string
}): boolean => {
  const around = parseDate(of)

  return (
    day >= around.subtract({ days }).toString() &&
    day <= around.add({ days }).toString()
  )
}
