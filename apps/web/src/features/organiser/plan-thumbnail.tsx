import type React from 'react'

import type { HallPlan } from '@scoreboard/protocol/hall-plan'

import { areaOf, standingTablesOf } from '@scoreboard/core/hall/hall-plan'

/** The stands' band under the floor, in metres of the drawing. */
const STANDS_M = 2.5
/** The drawn table's share of its play area. */
const TABLE_SHARE = 0.55

/** A saved plan at a glance: the floor, each table's blue top where it stands, the stands below. */
export const PlanThumbnail: React.FC<{ plan: HallPlan }> = ({ plan }) => (
  <svg
    aria-hidden='true'
    className='plan-thumbnail'
    focusable='false'
    viewBox={`0 0 ${plan.width} ${plan.depth + STANDS_M}`}
  >
    <rect
      className='plan-thumbnail-floor'
      height={plan.depth}
      width={plan.width}
    />
    <rect
      className='plan-thumbnail-stands'
      height={STANDS_M}
      width={plan.width}
      y={plan.depth}
    />
    {standingTablesOf(plan).map((table) => {
      const area = areaOf(table)
      const width = area.width * TABLE_SHARE
      const height = area.height * TABLE_SHARE

      return (
        <rect
          className='plan-thumbnail-table'
          height={height}
          key={table.table}
          width={width}
          x={area.x + (area.width - width) / 2}
          y={area.y + (area.height - height) / 2}
        />
      )
    })}
  </svg>
)
