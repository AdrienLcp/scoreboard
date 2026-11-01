import type React from 'react'

import type { HallPlan } from '@scoreboard/protocol/hall-plan'

import { areaOf, standingTablesOf } from '@scoreboard/core/hall/hall-plan'

import { withClass } from '@/presentation/components/class-names'
import { TableNumber } from '@/presentation/components/table-number'
import { TableTop } from '@/presentation/components/table-top'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import './club-hall-plan.sass'

const percentOf = (metres: number, total: number): string =>
  `${(metres / total) * 100}%`

/**
 * A kept plan of the club's hall seen from above, drawn to scale, the stands
 * at the bottom: each table standing on its play area, numbered. Reads as
 * well across the club page as in a thumbnail a few centimetres wide.
 */
export const ClubHallPlan: React.FC<{ className?: string; plan: HallPlan }> = ({
  className,
  plan
}) => {
  const translate = useTranslate()

  return (
    <figure className={withClass('club-hall', className)}>
      <div
        className='club-hall-floor'
        style={{
          '--hall-width': plan.width,
          aspectRatio: `${plan.width} / ${plan.depth}`
        }}
      >
        {standingTablesOf(plan).map((table) => {
          const area = areaOf(table)

          return (
            <span
              className='club-hall-table'
              data-turned={table.isTurned || undefined}
              key={table.table}
              style={{
                height: percentOf(area.height, plan.depth),
                left: percentOf(area.x, plan.width),
                top: percentOf(area.y, plan.depth),
                width: percentOf(area.width, plan.width)
              }}
            >
              <span className='club-hall-drawing'>
                <TableTop isTurned={table.isTurned} />
              </span>
              <TableNumber className='club-hall-number' number={table.table} />
            </span>
          )
        })}
      </div>
      <figcaption className='club-hall-stands'>
        {translate('organiser.hall.stands')}
      </figcaption>
    </figure>
  )
}
