import type React from 'react'

import type { HallPlan } from '@scoreboard/protocol/hall-plan'
import type { TableNumber } from '@scoreboard/protocol/identifiers'

import {
  areaOf,
  type HallArea,
  hallTableOf,
  type StandingPair
} from '@scoreboard/core/hall/hall-plan'

/** Less than this apart, two edges of the hall are one. */
const SAME_EDGE_M = 0.01

/** A length of the hall as a share of the floor that draws it. */
export const percentOf = (metres: number, total: number): string =>
  `${(metres / total) * 100}%`

/** Where an area of the hall sits on its floor drawn to scale. */
export const placedOn = (
  area: HallArea,
  plan: HallPlan
): React.CSSProperties => ({
  height: percentOf(area.height, plan.depth),
  left: percentOf(area.x, plan.width),
  top: percentOf(area.y, plan.depth),
  width: percentOf(area.width, plan.width)
})

/** The floor in the hall's own proportion, telling what stands on it how wide the hall is. */
export const floorStyleOf = (plan: HallPlan): React.CSSProperties => ({
  '--hall-width': plan.width,
  aspectRatio: `${plan.width} / ${plan.depth}`
})

/** The tables of a block standing along its top edge, under the band that names it. */
export const tablesAlongTopOf = (
  pair: StandingPair,
  plan: HallPlan
): TableNumber[] =>
  pair.tables.filter((table) => {
    const here = hallTableOf(plan, table)

    return (
      here !== undefined && Math.abs(areaOf(here).y - pair.area.y) < SAME_EDGE_M
    )
  })
