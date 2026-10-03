import type { Translate } from '@/presentation/i18n/translation'

const MINUTE_MS = 60_000
const MINUTES_PER_HOUR = 60

/** A length of time as the hall says it: "< 1 min", "24 min", "1 h 05". */
export const formatDuration = (translate: Translate, durationMs: number) => {
  const totalMinutes = Math.floor(Math.max(0, durationMs) / MINUTE_MS)

  if (totalMinutes < 1) {
    return translate('time.underAMinute')
  }

  if (totalMinutes < MINUTES_PER_HOUR) {
    return translate('time.minutes', { minutes: totalMinutes })
  }

  return translate('time.hoursMinutes', {
    hours: Math.floor(totalMinutes / MINUTES_PER_HOUR),
    minutes: String(totalMinutes % MINUTES_PER_HOUR).padStart(2, '0')
  })
}
