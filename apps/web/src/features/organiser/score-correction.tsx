import type React from 'react'
import { useState } from 'react'

import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { MatchId } from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'
import { sides } from '@scoreboard/protocol/side'

import { newId } from '@/infrastructure/ids'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import {
  FieldError,
  Input,
  Label,
  TextField
} from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

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
      <p>
        {sides.map((side) => (
          <Button
            key={side}
            onPress={() =>
              onRecord(match.id, {
                by: side,
                id: newId(),
                reason: 'walkover',
                type: 'match.conceded'
              })
            }
          >
            {translate(`organiser.correction.walkover.${side}`)}
          </Button>
        ))}
      </p>
    )
  }

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault()

        if (periods !== null) {
          onRecord(match.id, { id: newId(), periods, type: 'score.corrected' })
        }
      }}
    >
      <TextField isInvalid={periods === null} onChange={setTyped} value={typed}>
        <Label>{translate('organiser.correction.label')}</Label>
        <Input />
        <FieldError>{translate('organiser.correction.invalid')}</FieldError>
      </TextField>
      <Button isDisabled={periods === null} type='submit'>
        {translate('organiser.correction.submit')}
      </Button>
      <Button
        isDisabled={!state.canUndo}
        onPress={() =>
          onRecord(match.id, { id: newId(), type: 'score.undone' })
        }
      >
        {translate('organiser.correction.undo')}
      </Button>
    </Form>
  )
}
