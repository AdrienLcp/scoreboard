import type React from 'react'

import { TIMEOUT_MS } from '@scoreboard/core/discipline/timeout-clock'

import { useTranslate } from '@/presentation/i18n/i18n-context'

import './wall-timeout.sass'

const SECOND_MS = 1000
const ARC_RADIUS = 40
const ARC_LENGTH = 2 * Math.PI * ARC_RADIUS

/** A running time-out above the net: the seconds left inside an orange arc that empties. */
export const WallTimeout: React.FC<{ remainingMs: number }> = ({
  remainingMs
}) => {
  const translate = useTranslate()
  const seconds = Math.ceil(remainingMs / SECOND_MS)

  return (
    <div
      aria-label={translate('display.wall.timeoutLeft', { seconds })}
      className='wall-timeout'
      role='timer'
    >
      <svg aria-hidden='true' focusable='false' viewBox='0 0 92 92'>
        <circle className='wall-timeout-disc' cx='46' cy='46' r='46' />
        <circle
          className='wall-timeout-arc'
          cx='46'
          cy='46'
          r={ARC_RADIUS}
          strokeDasharray={ARC_LENGTH}
          strokeDashoffset={ARC_LENGTH * (1 - remainingMs / TIMEOUT_MS)}
        />
      </svg>
      <b>{seconds}</b>
    </div>
  )
}
