import type React from 'react'

import type { Player } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { Score } from '@scoreboard/protocol/side'

import { useTranslate } from '@/presentation/i18n/i18n-context'

import { MatchTimingLine } from './match-timing-line'
import { participantNames } from './participant-names'

type MatchLineProps = {
  match: MatchView
  players: readonly Player[]
}

const scoreText = (score: Score): string => `${score.home}–${score.away}`

/** One match: who plays, the games, the score of the game on, and its times. */
export const MatchLine: React.FC<MatchLineProps> = ({ match, players }) => {
  const translate = useTranslate()
  const sideName = (side: 'home' | 'away'): string =>
    participantNames(players, match[side]).join(' / ') ||
    translate('match.unnamedSide')
  const { state } = match

  return (
    <>
      <p>
        {match.label === null ? null : <span>{match.label} · </span>}
        <span>{sideName('home')}</span>
        {' — '}
        <span>{sideName('away')}</span>
        {' · '}
        <span>{translate(`match.status.${state.status}`)}</span>
        {state.status === 'scheduled' ? null : (
          <>
            {' · '}
            <span>{scoreText(state.periodsWon)}</span>
            {state.current === null ? null : (
              <span> ({scoreText(state.current)})</span>
            )}
          </>
        )}
      </p>
      <MatchTimingLine match={match} />
    </>
  )
}
