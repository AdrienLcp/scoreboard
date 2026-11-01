import type React from 'react'

import type { HallPlan } from '@scoreboard/protocol/hall-plan'

import {
  areaOf,
  hallTableOf,
  type StandingPair
} from '@scoreboard/core/hall/hall-plan'

type PlanLinksProps = {
  pairs: readonly StandingPair[]
  /** Where each table stands, the one being dragged included. */
  plan: HallPlan
}

/** A dashed line from centre to centre joins the two tables of a block that do not touch. */
export const PlanLinks: React.FC<PlanLinksProps> = ({ pairs, plan }) => (
  <svg
    aria-hidden='true'
    className='plan-links'
    preserveAspectRatio='none'
    viewBox={`0 0 ${plan.width} ${plan.depth}`}
  >
    {pairs
      .filter((pair) => !pair.isAdjacent)
      .map((pair) => {
        const [one, other] = pair.tables.map((table) => {
          const here = hallTableOf(plan, table)

          return here === undefined ? pair.area : areaOf(here)
        })

        return one === undefined || other === undefined ? null : (
          <line
            key={pair.tables[0]}
            vectorEffect='non-scaling-stroke'
            x1={one.x + one.width / 2}
            x2={other.x + other.width / 2}
            y1={one.y + one.height / 2}
            y2={other.y + other.height / 2}
          />
        )
      })}
  </svg>
)
