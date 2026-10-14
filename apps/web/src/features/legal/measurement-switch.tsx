import { classNames } from '@adrienlcp/react'
import type React from 'react'
import { useId } from 'react'

import { Switch } from '@/presentation/components/switch'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import {
  type MeasurementChoice,
  useMeasurementChoice
} from './use-measurement-choice'

import './measurement-switch.sass'

const NOTE_KEY_FOR = {
  counted: 'legal.measurement.counted',
  refused: 'legal.measurement.refused',
  'refused-by-browser': 'legal.measurement.refusedByBrowser',
  'storage-blocked': 'legal.measurement.storageBlocked'
} as const satisfies Record<MeasurementChoice, string>

/** Lets a visitor refuse audience measurement for this browser, and says what holds now. */
export const MeasurementSwitch: React.FC = () => {
  const translate = useTranslate()
  const noteId = useId()
  const { choice, hasSaveFailed, setCounted } = useMeasurementChoice()
  const isDecidedElsewhere =
    choice === 'refused-by-browser' || choice === 'storage-blocked'

  return (
    <div className='measurement-switch'>
      <Switch
        aria-describedby={noteId}
        isDisabled={isDecidedElsewhere}
        isSelected={choice === 'counted'}
        onChange={setCounted}
      >
        {translate('legal.measurement.switch')}
      </Switch>
      <p
        className={classNames('measurement-note', hasSaveFailed && 'failed')}
        id={noteId}
        role='status'
      >
        {translate(
          hasSaveFailed ? 'legal.measurement.saveFailed' : NOTE_KEY_FOR[choice]
        )}
      </p>
    </div>
  )
}
