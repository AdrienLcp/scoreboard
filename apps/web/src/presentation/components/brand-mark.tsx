import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-context'

import './brand-mark.sass'

/**
 * The app's own identity: a scoreboard frame split in two, one side lit. It
 * draws no sport, so any ruleset can sit behind it.
 */
export const BrandMark: React.FC = () => {
  const translate = useTranslate()

  return (
    <span className='brand-mark'>
      <svg aria-hidden='true' focusable='false' viewBox='0 0 24 24'>
        <rect
          className='frame'
          height='15'
          rx='3.5'
          width='19'
          x='2.5'
          y='4.5'
        />
        <path className='frame' d='M12 8.5v7' />
        <path className='lit' d='M6.5 12h2.5' />
        <path className='frame' d='M15 12h2.5' />
      </svg>
      <span>{translate('app.name')}</span>
    </span>
  )
}
