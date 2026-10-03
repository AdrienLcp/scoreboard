import type React from 'react'

import { RollingNumber } from '@/presentation/components/rolling-number'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { EncounterLine } from './encounter-lines'

import './encounter-score.sass'

type EncounterScoreProps = {
  encounter: EncounterLine
}

/**
 * Two teams and their running points, the team behind dimmed: the same block
 * on the big screen, a visitor's phone and an umpire's console.
 */
export const EncounterScore: React.FC<EncounterScoreProps> = ({
  encounter
}) => {
  const translate = useTranslate()
  const { away, home } = encounter.points

  return (
    <div className='encounter-score'>
      {encounter.tables.length === 0 ? null : (
        <p className='encounter-meta'>
          {translate('encounter.tables', {
            count: encounter.tables.length,
            tables: encounter.tables.map(String)
          })}
        </p>
      )}
      <p className='encounter-team' data-trailing={home < away || undefined}>
        <span>{encounter.homeName}</span>
        <b>
          <RollingNumber value={home} />
        </b>
      </p>
      <p className='encounter-team' data-trailing={away < home || undefined}>
        <span>{encounter.awayName}</span>
        <b>
          <RollingNumber value={away} />
        </b>
      </p>
    </div>
  )
}
