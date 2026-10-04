import type React from 'react'

import type { ServeTurn } from '@scoreboard/protocol/match-state'

import { PlainButton } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { RollingNumber } from '@/presentation/components/rolling-number'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './point-target.sass'

type PointTargetProps = {
  gamesWon: number
  /** One point from the game or the match: the score lights up. */
  isHot: boolean
  isServing: boolean
  /** Which arrow key scores for this side on a keyboard. */
  keyHint: 'arrowLeft' | 'arrowRight'
  name: string
  onPoint: () => void
  score: number
  /** Where the coming serve falls in the server's turn, when the sport counts it. */
  serveTurn: ServeTurn | null
}

const serveLabelKeyOf = (serveTurn: ServeTurn | null) => {
  if (serveTurn === null) {
    return 'umpire.serve'
  }

  if (serveTurn.serves === 1) {
    return 'umpire.serveTurn.lone'
  }

  return serveTurn.serve === 1
    ? 'umpire.serveTurn.first'
    : 'umpire.serveTurn.second'
}

/** Half of the console: the whole surface gives this side a point. */
export const PointTarget: React.FC<PointTargetProps> = ({
  gamesWon,
  isHot,
  isServing,
  keyHint,
  name,
  onPoint,
  score,
  serveTurn
}) => {
  const translate = useTranslate()

  return (
    <PlainButton
      aria-label={translate('umpire.point', { name, score })}
      className='point-target'
      data-hot={isHot || undefined}
      onPress={onPoint}
    >
      <span className='point-target-head'>
        <span className='point-target-name'>{name}</span>
        {isServing ? (
          <span className='point-target-serve'>
            <Icon name='serve' />
            {translate(serveLabelKeyOf(serveTurn))}
          </span>
        ) : null}
      </span>
      <span className='point-target-score'>
        <RollingNumber value={score} />
      </span>
      <span className='point-target-foot'>
        <span>
          {translate('umpire.gamesWon')}
          <b>{gamesWon}</b>
        </span>
        <kbd className='point-target-key'>
          <Icon name={keyHint} />
        </kbd>
      </span>
    </PlainButton>
  )
}
