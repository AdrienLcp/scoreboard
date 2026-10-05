import type React from 'react'
import { useState } from 'react'

import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { MatchId } from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'
import { sides } from '@scoreboard/protocol/side'

import { newScoringEventId } from '@/infrastructure/ids'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Icon } from '@/presentation/components/icon'
import {
  Description,
  FieldError,
  Input,
  Label,
  TextField
} from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { ConfirmButton } from './confirm-button'
import { parsePeriodsText, periodsText } from './periods-text'

type ScoreCorrectionProps = {
  match: MatchView
  onRecord: (matchId: MatchId, event: ScoringEvent) => void
}

/** The organiser's hand on a match: rewrite its score, or record a walkover. */
export const ScoreCorrection: React.FC<ScoreCorrectionProps> = ({
  match,
  onRecord
}) => {
  const translate = useTranslate()
  const { state } = match
  const shownPeriods =
    state.current === null ? state.periods : [...state.periods, state.current]
  const [typed, setTyped] = useState(periodsText(shownPeriods))
  const periods = parsePeriodsText(typed)

  if (state.status === 'scheduled') {
    return (
      <div className='correction-walkover'>
        <p>{translate('organiser.correction.walkoverExplain')}</p>
        <div className='correction-actions'>
          {sides.map((side) => (
            <ConfirmButton
              confirmLabel={translate(
                `organiser.correction.walkoverConfirm.${side}`
              )}
              key={side}
              label={translate(`organiser.correction.walkover.${side}`)}
              onConfirm={() =>
                onRecord(match.id, {
                  by: side,
                  id: newScoringEventId(),
                  reason: 'walkover',
                  type: 'match.conceded'
                })
              }
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <Form
      className='correction-form'
      onSubmit={(event) => {
        event.preventDefault()

        if (periods !== null) {
          onRecord(match.id, {
            id: newScoringEventId(),
            periods,
            type: 'score.corrected'
          })
        }
      }}
    >
      <TextField isInvalid={periods === null} onChange={setTyped} value={typed}>
        <Label>{translate('organiser.correction.label')}</Label>
        <Input className='correction-input' />
        <Description>{translate('organiser.correction.hint')}</Description>
        <FieldError>
          <Icon name='alert' />
          {translate('organiser.correction.invalid')}
        </FieldError>
      </TextField>
      <div className='correction-actions'>
        <Button
          isDisabled={!state.canUndo}
          onPress={() =>
            onRecord(match.id, {
              id: newScoringEventId(),
              type: 'score.undone'
            })
          }
          variant='quiet'
        >
          <Icon name='undo' />
          {translate('organiser.correction.undo')}
        </Button>
        <Button isDisabled={periods === null} type='submit'>
          {translate('organiser.correction.submit')}
        </Button>
      </div>
    </Form>
  )
}
