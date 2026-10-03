import type { InstantMs } from '@scoreboard/protocol/scoring-event'

import { parseLocalDateTime } from '@/infrastructure/dates'

/** A `datetime-local` field's value: empty clears the time, anything unreadable is refused. */
export const readTypedInstant = (
  text: string
): InstantMs | null | 'invalid' => {
  if (text === '') {
    return null
  }

  const parsed = parseLocalDateTime(text)

  return parsed.status === 'success' ? parsed.data : 'invalid'
}
