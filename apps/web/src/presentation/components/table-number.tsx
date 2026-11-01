import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-context'

import { withClass } from './class-names'
import { Icon } from './icon'

import './table-number.sass'

type TableNumberProps = {
  className?: string
  /** `null` for a match under way that waits for a table: a pause mark. */
  number: number | null
}

/** The chip a player looks for from across the hall; reads "Table 4" to assistive technology. */
export const TableNumber: React.FC<TableNumberProps> = ({
  className,
  number
}) => {
  const translate = useTranslate()

  if (number === null) {
    return (
      <span
        className={withClass('table-number', className)}
        data-waiting='true'
      >
        <span className='visually-hidden'>{translate('table.waiting')}</span>
        <Icon name='pause' />
      </span>
    )
  }

  return (
    <span className={withClass('table-number', className)}>
      <span className='visually-hidden'>{translate('table.prefix')}</span>
      {number}
    </span>
  )
}
