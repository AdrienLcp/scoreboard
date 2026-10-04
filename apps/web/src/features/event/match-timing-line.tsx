import type React from 'react'

import type { MatchView } from '@scoreboard/protocol/event-snapshot'

import { toDate } from '@/infrastructure/dates'
import { useTranslate } from '@/presentation/i18n/i18n-context'

type MatchTimingLineProps = {
  match: MatchView
}

const MINUTE_MS = 60_000

/** When the match was played or should be, in one line. */
export const MatchTimingLine: React.FC<MatchTimingLineProps> = ({ match }) => {
  const translate = useTranslate()
  const { plannedAtMs, timing } = match
  const parts = [
    plannedAtMs === null
      ? null
      : translate('timing.planned', { at: toDate(plannedAtMs) }),
    timing.estimatedStartMs === null
      ? null
      : translate('timing.estimated', { at: toDate(timing.estimatedStartMs) }),
    timing.startedAtMs === null
      ? null
      : translate('timing.started', { at: toDate(timing.startedAtMs) }),
    timing.finishedAtMs === null
      ? null
      : translate('timing.finished', { at: toDate(timing.finishedAtMs) }),
    timing.durationMs === null
      ? null
      : translate('timing.duration', {
          minutes: Math.round(timing.durationMs / MINUTE_MS)
        })
  ].filter((part) => part !== null)

  return parts.length === 0 ? null : <p>{parts.join(' · ')}</p>
}
