import type React from 'react'
import { useState } from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type { PublicSnapshot } from '@scoreboard/protocol/event-snapshot'
import type { EventId, MatchId } from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'

import { useClubTranslate } from '@/features/club/use-club-translate'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'

import { ChampionshipEncounters } from './championship-encounters'
import { type EventFormat, eventFormatOf } from './event-format'
import { FormatChoice } from './format-choice'
import { MatchesEditor } from './matches-editor'
import { TournamentEditor } from './tournament-editor'

import './encounters-step.sass'

export type EncountersStepProps = {
  /** The format picked in the console before anything of it is saved. */
  chosenFormat: EventFormat | null
  event: PublicSnapshot
  eventId: EventId
  onChooseFormat: (format: EventFormat) => void
  onNext: () => void
  onRecord: (matchId: MatchId, event: ScoringEvent) => void
  onSave: (setup: EventSetup) => boolean
  setup: EventSetup
}

/**
 * The console's encounters step: the day's format, read off what it already
 * plays and changed in one choice that deletes nothing, then what that format
 * prepares — the championship's encounters on their blocks, the pools and
 * their bracket, or matches one by one.
 */
export const EncountersStep: React.FC<EncountersStepProps> = ({
  chosenFormat,
  event,
  eventId,
  onChooseFormat,
  onNext,
  onRecord,
  onSave,
  setup
}) => {
  const translate = useClubTranslate()
  const [isChoosing, setIsChoosing] = useState(false)
  const format = chosenFormat ?? eventFormatOf(setup)

  if (isChoosing || format === null) {
    return (
      <FormatChoice
        current={format}
        onChoose={(next) => {
          onChooseFormat(next)
          setIsChoosing(false)
        }}
      />
    )
  }

  if (format === 'championship') {
    return (
      <ChampionshipEncounters
        event={event}
        eventId={eventId}
        onChangeFormat={() => setIsChoosing(true)}
        onNext={onNext}
        onRecord={onRecord}
        onSave={onSave}
        setup={setup}
      />
    )
  }

  return (
    <div className='encounters-step-single'>
      <div className='encounters-step-head'>
        <h2>{translate(`organiser.steps.format.${format}`)}</h2>
        <Button onPress={() => setIsChoosing(true)} variant='quiet'>
          {translate('organiser.encountersStep.changeFormat')}
        </Button>
      </div>
      {format === 'pools' ? (
        <TournamentEditor
          matches={event.matches}
          onSave={onSave}
          setup={setup}
        />
      ) : (
        <MatchesEditor
          matches={event.matches}
          onRecord={onRecord}
          onSave={onSave}
          setup={setup}
        />
      )}
      <Button
        className='encounters-step-next'
        onPress={onNext}
        variant='primary'
      >
        {translate('organiser.steps.next.live')}
        <Icon name='arrowRight' />
      </Button>
    </div>
  )
}
