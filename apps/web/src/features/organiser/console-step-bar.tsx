import type React from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type { PublicSnapshot } from '@scoreboard/protocol/event-snapshot'
import type { EventId } from '@scoreboard/protocol/identifiers'

import {
  type ConsoleStep,
  organiserStepPathFor
} from '@/infrastructure/router/navigation'
import { Icon, type IconName } from '@/presentation/components/icon'
import { Link } from '@/presentation/components/link'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { type StepStatus, stepStatusOf } from './console-steps'
import type { EventFormat } from './event-format'

import './console-step-bar.sass'

type DayStep = Exclude<ConsoleStep, 'settings'>

const DAY_STEPS: readonly { icon: IconName; step: DayStep }[] = [
  { icon: 'plans', step: 'hall' },
  { icon: 'teams', step: 'encounters' },
  { icon: 'live', step: 'live' }
]

const useStatusText = () => {
  const translate = useTranslate()

  return (status: StepStatus): string => {
    switch (status.kind) {
      case 'hall':
        return [
          translate('organiser.steps.status.tables', { count: status.tables }),
          status.screens === 0
            ? translate('organiser.steps.status.noScreen')
            : translate('organiser.steps.status.screens', {
                count: status.screens
              })
        ].join(' · ')
      case 'formatToChoose':
        return translate('organiser.steps.status.formatToChoose')
      case 'pools':
        return translate('organiser.steps.status.pools', {
          count: status.players
        })
      case 'freeMatches':
        return translate('organiser.steps.status.freeMatches', {
          count: status.matches
        })
      case 'noEncounter':
        return translate('organiser.steps.status.noEncounter')
      case 'unseated':
        return translate('organiser.steps.status.unseated', {
          count: status.encounters
        })
      case 'lineupsToDo':
        return translate('organiser.steps.status.lineupsToDo', {
          count: status.encounters
        })
      case 'encountersReady':
        return translate('organiser.steps.status.encountersReady', {
          count: status.encounters
        })
      case 'running':
        return translate('organiser.steps.status.running', {
          count: status.matches
        })
      case 'nothingRunning':
        return translate('organiser.steps.status.nothingRunning')
    }
  }
}

type ConsoleStepBarProps = {
  chosenFormat: EventFormat | null
  /** The screens a TV shows right now. */
  connectedScreens: number
  current: ConsoleStep
  event: PublicSnapshot
  eventId: EventId
  setup: EventSetup
}

/**
 * The day in three steps, each with its state in a line: the hall, the
 * encounters, the live day. None ever locks; each is one tap away at any time.
 */
export const ConsoleStepBar: React.FC<ConsoleStepBarProps> = ({
  chosenFormat,
  connectedScreens,
  current,
  event,
  eventId,
  setup
}) => {
  const translate = useTranslate()
  const statusText = useStatusText()

  return (
    <nav aria-label={translate('organiser.steps.label')} className='step-bar'>
      {DAY_STEPS.map(({ icon, step }) => (
        <Link
          aria-current={current === step ? 'step' : undefined}
          className='step-link'
          href={organiserStepPathFor({ eventId, step })}
          key={step}
        >
          <Icon name={icon} />
          <b>{translate(`organiser.steps.${step}`)}</b>
          <small>
            {statusText(
              stepStatusOf({
                chosenFormat,
                connectedScreens,
                event,
                setup,
                step
              })
            )}
          </small>
        </Link>
      ))}
    </nav>
  )
}
