import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-context'

import { withClass } from './class-names'

import './table-number.sass'

type TableNumberProps = {
  className?: string
  number: number
}

/** The chip a player looks for from across the hall; reads "Table 4" to assistive technology. */
export const TableNumber: React.FC<TableNumberProps> = ({
  className,
  number
}) => {
  const translate = useTranslate()

  return (
    <span className={withClass('table-number', className)}>
      <span className='visually-hidden'>{translate('table.prefix')}</span>
      {number}
    </span>
  )
}
