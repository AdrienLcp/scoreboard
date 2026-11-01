import type React from 'react'

import type { HallPlan, HallTable } from '@scoreboard/protocol/hall-plan'

import { DrawnTable } from '@/presentation/components/drawn-table'
import { TableNumber } from '@/presentation/components/table-number'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import './club-hall-plan.sass'

/** A row or column of the grid no table stands in: an aisle, kept narrow. */
const AISLE_TRACK = '0.75rem'

const trackList = (
  tables: readonly HallTable[],
  axis: 'column' | 'row'
): string => {
  const extent = Math.max(0, ...tables.map((table) => table[axis] + 1))

  return Array.from({ length: extent }, (_, place) =>
    tables.some((table) => table[axis] === place) ? 'auto' : AISLE_TRACK
  ).join(' ')
}

/** The club's hall seen from above, stands at the bottom, as every new day starts from it. */
export const ClubHallPlan: React.FC<{ plan: HallPlan }> = ({ plan }) => {
  const translate = useTranslate()

  return (
    <figure className='club-hall'>
      <div
        className='club-hall-floor'
        style={{
          gridTemplateColumns: trackList(plan.tables, 'column'),
          gridTemplateRows: trackList(plan.tables, 'row')
        }}
      >
        {plan.tables.map((table) => (
          <span
            className='club-hall-table'
            key={table.table}
            style={{ gridColumn: table.column + 1, gridRow: table.row + 1 }}
          >
            <TableNumber number={table.table} />
            <DrawnTable className='club-hall-drawing' isIdle />
          </span>
        ))}
      </div>
      <figcaption className='club-hall-stands'>
        {translate('organiser.hall.stands')}
      </figcaption>
    </figure>
  )
}
