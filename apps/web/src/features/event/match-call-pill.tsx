import type React from 'react'

import type { MatchView } from '@scoreboard/protocol/event-snapshot'

import { StatePill } from '@/presentation/components/state-pill'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { MatchCall } from './match-call'

type MatchCallPillProps = {
  call: MatchCall | null
  /** A match that just ended, still on screen: says how it ended. */
  isOver?: boolean
  match: MatchView
}

/** The one pill a match may wear: the call of the moment, or how it ended. */
export const MatchCallPill: React.FC<MatchCallPillProps> = ({
  call,
  isOver = false,
  match
}) => {
  const translate = useTranslate()

  if (isOver) {
    return (
      <StatePill tone='over'>
        {match.state.concession === null
          ? translate('match.call.over')
          : translate(`match.concession.${match.state.concession.reason}`)}
      </StatePill>
    )
  }

  if (call === null) {
    return null
  }

  return (
    <StatePill key={call.kind} tone={call.kind}>
      {translate(`match.call.${call.kind}`)}
    </StatePill>
  )
}
