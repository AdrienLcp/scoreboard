import type React from 'react'

import { Icon } from './icon'

import './state-pill.sass'

/**
 * The one state a match shows at a time, by how much it matters:
 * - `'match-point'` — filled in the live accent
 * - `'game-point'` — outlined in the live accent
 * - `'deuce'` — outlined in white
 * - `'over'` — a match that just ended, on a neutral fill
 */
export type PillTone = 'match-point' | 'game-point' | 'deuce' | 'over'

type StatePillProps = {
  children: React.ReactNode
  tone: PillTone
}

export const StatePill: React.FC<StatePillProps> = ({ children, tone }) => (
  <span className='state-pill' data-tone={tone}>
    {tone === 'over' ? <Icon name='check' /> : null}
    <span>{children}</span>
  </span>
)
