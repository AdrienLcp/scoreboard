import type { InstantMs } from '@scoreboard/protocol/scoring-event'

import { toDate } from '@/infrastructure/dates'
import type { Translate } from '@/presentation/i18n/translation'

/** Under this, an estimate is the present: "≈ 23:08" at 23:08 tells the room nothing. */
const IMMINENT_MS = 60_000

/** When a match should start, as the room reads it: now, or "≈ 15:40". */
export const startLabel = ({
  nowMs,
  startMs,
  translate
}: {
  nowMs: InstantMs
  startMs: InstantMs
  translate: Translate
}): string =>
  startMs - nowMs <= IMMINENT_MS
    ? translate('time.now')
    : translate('display.around', { at: toDate(startMs) })
