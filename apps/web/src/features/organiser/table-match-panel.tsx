import type React from 'react'
import { useState } from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { MatchId, TableNumber } from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'
import type { Side } from '@scoreboard/protocol/side'

import { isDoublesLabel } from '@scoreboard/core/encounter/encounter-sheet'

import { sideName } from '@/features/event/participant-names'
import { scoreText, versusText } from '@/features/event/score-text'
import { wallCallOf } from '@/features/event/sheet-call'
import { currentMatchOn } from '@/features/event/table-match'
import { newScoringEventId } from '@/infrastructure/ids'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { ScoreCorrection } from './score-correction'
import { UmpireField } from './umpire-field'

import './table-match-panel.sass'

/** The latest match a table has started: the one live on it, else the last it finished. */
const lastStartedOn = (
  event: PublicSnapshot,
  table: TableNumber
): MatchView | null =>
  event.matches
    .filter(
      (match) => match.table === table && match.state.status !== 'scheduled'
    )
    .at(-1) ?? null

type TableMatchPanelProps = {
  event: PublicSnapshot
  onRecord: (matchId: MatchId, event: ScoringEvent) => void
  onSaveSetup: (setup: EventSetup) => void
  setup: EventSetup
  table: TableNumber
}

/**
 * What a table is playing, in the organiser's hand: the match on it and its
 * umpire, changed in one pick, and its score corrected game by game, or the
 * last one it finished while the next waits.
 */
export const TableMatchPanel: React.FC<TableMatchPanelProps> = ({
  event,
  onRecord,
  onSaveSetup,
  setup,
  table
}) => {
  const translate = useTranslate()
  const [correctingId, setCorrectingId] = useState<MatchId | null>(null)
  const [correctedId, setCorrectedId] = useState<MatchId | null>(null)
  const match = currentMatchOn(event, table)
  const correctable = lastStartedOn(event, table)

  if (match === null) {
    return null
  }

  const callOf = (shown: MatchView): string | null =>
    isDoublesLabel(shown.label)
      ? translate('display.wall.doubles')
      : wallCallOf(shown)
  const sideNameOf = (shown: MatchView, side: Side): string =>
    sideName({
      form: 'full',
      participant: shown[side],
      players: event.players
    }) ?? translate('match.unnamedSide')
  const namesOf = (shown: MatchView): string =>
    versusText(sideNameOf(shown, 'home'), sideNameOf(shown, 'away'))
  const corrected =
    correctable !== null &&
    correctable.id === correctedId &&
    correctable.state.canUndo
      ? correctable
      : null

  return (
    <section className='table-match' data-status={match.state.status}>
      <div className='table-match-head'>
        <p className='table-match-call'>
          {[callOf(match), translate(`match.status.${match.state.status}`)]
            .filter((part) => part !== null)
            .join(' · ')}
        </p>
        <p className='table-match-names'>{namesOf(match)}</p>
        {match.state.status === 'scheduled' ? null : (
          <p className='table-match-score'>
            {scoreText(
              match.state.periodsWon.home,
              match.state.periodsWon.away
            )}
          </p>
        )}
      </div>
      {match.encounterId === null ? null : (
        <UmpireField
          event={event}
          match={match}
          onSave={onSaveSetup}
          setup={setup}
        />
      )}
      {correctable === null ? null : correctingId === correctable.id ? (
        <div className='table-match-correction'>
          <div className='table-match-correction-head'>
            <h4>
              {correctable.id === match.id
                ? translate('organiser.correction.openScore')
                : translate('organiser.tableMatch.correctPrevious', {
                    call: callOf(correctable) ?? namesOf(correctable)
                  })}
            </h4>
            <Button
              aria-label={translate('organiser.tableMatch.closeCorrection')}
              onPress={() => setCorrectingId(null)}
              variant='quiet'
            >
              <Icon name='close' />
            </Button>
          </div>
          <ScoreCorrection
            key={correctable.id}
            match={correctable}
            onCorrected={() => {
              setCorrectingId(null)
              setCorrectedId(correctable.id)
            }}
            onRecord={onRecord}
            players={event.players}
          />
        </div>
      ) : (
        <div className='table-match-actions'>
          <Button onPress={() => setCorrectingId(correctable.id)}>
            <Icon name='edit' />
            {correctable.id === match.id
              ? translate('organiser.correction.openScore')
              : translate('organiser.tableMatch.correctPrevious', {
                  call: callOf(correctable) ?? namesOf(correctable)
                })}
          </Button>
          {corrected === null ? null : (
            <p className='table-match-corrected'>
              <Icon name='check' />
              {translate('organiser.correction.corrected')}
              <Button
                onPress={() => {
                  onRecord(corrected.id, {
                    id: newScoringEventId(),
                    type: 'score.undone'
                  })
                  setCorrectedId(null)
                }}
                variant='quiet'
              >
                <Icon name='undo' />
                {translate('organiser.tableMatch.undoCorrection')}
              </Button>
            </p>
          )}
        </div>
      )}
    </section>
  )
}
