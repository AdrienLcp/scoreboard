import type React from 'react'

import { useClubTranslate } from '@/features/club/use-club-translate'
import { Icon } from '@/presentation/components/icon'

import type { LivePillKind } from './live-state'

import './live-pill.sass'

/** The one word a live table wears: a won game or match on orange, a level score in an ink frame. */
export const LivePill: React.FC<{ pill: LivePillKind }> = ({ pill }) => {
  const translate = useClubTranslate()

  return (
    <span className='live-pill' data-pill={pill}>
      {pill === 'deuce' ? null : <Icon name='check' />}
      {translate(`organiser.live.pill.${pill}`)}
    </span>
  )
}
