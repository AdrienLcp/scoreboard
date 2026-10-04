import type React from 'react'

import type { Player } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { MatchId } from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'

import { sideName } from '@/features/event/participant-names'
import { toDate } from '@/infrastructure/dates'
import { PlainButton } from '@/presentation/components/button'
import {
  Disclosure,
  DisclosurePanel
} from '@/presentation/components/disclosure'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { ScoreCorrection } from './score-correction'

type MatchRowProps = {
  /** The row's own controls, beside the correction: table, time, removal. */
  children?: React.ReactNode
  match: MatchView
  onRecord: (matchId: MatchId, event: ScoringEvent) => void
  players: readonly Player[]
  /** Removing the match, kept inside the folded correction, apart from everyday controls. */
  removal?: React.ReactNode
}

/** One match as the organiser runs it: who, where it stands, and a correction kept folded. */
export const MatchRow: React.FC<MatchRowProps> = ({
  children,
  match,
  onRecord,
  players,
  removal
}) => {
  const translate = useTranslate()
  const { state, timing } = match
  const names = [match.home, match.away]
    .map(
      (participant) =>
        sideName({ form: 'full', participant, players }) ??
        translate('match.unnamedSide')
    )
    .join(' – ')
  const score =
    state.status === 'scheduled'
      ? null
      : [
          state.concession === null
            ? null
            : `${translate(`match.concession.${state.concession.reason}`)} ·`,
          `${state.periodsWon.home}–${state.periodsWon.away}`,
          state.current === null
            ? null
            : `(${state.current.home}–${state.current.away})`
        ]
          .filter((part) => part !== null)
          .join(' ')
  const when =
    timing.finishedAtMs !== null
      ? translate('timing.finished', { at: toDate(timing.finishedAtMs) })
      : timing.startedAtMs !== null
        ? translate('timing.started', { at: toDate(timing.startedAtMs) })
        : timing.estimatedStartMs !== null
          ? translate('timing.estimated', {
              at: toDate(timing.estimatedStartMs)
            })
          : match.plannedAtMs !== null
            ? translate('timing.planned', { at: toDate(match.plannedAtMs) })
            : null

  return (
    <Disclosure className='match-row' data-status={state.status}>
      <div className='match-row-main'>
        <div className='match-row-who'>
          <p className='match-row-names'>{names}</p>
          <p className='match-row-meta'>
            {[match.label, translate(`match.status.${state.status}`), when]
              .filter((part) => part !== null)
              .join(' · ')}
          </p>
        </div>
        {score === null ? null : <p className='match-row-score'>{score}</p>}
        <div className='match-row-controls'>
          {children}
          <PlainButton className='match-row-toggle' slot='trigger'>
            {translate('organiser.correction.open')}
            <Icon name='chevronDown' />
          </PlainButton>
        </div>
      </div>
      <DisclosurePanel>
        <div className='match-row-correction'>
          <ScoreCorrection match={match} onRecord={onRecord} />
          {removal === undefined ? null : (
            <div className='match-row-removal'>{removal}</div>
          )}
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}
