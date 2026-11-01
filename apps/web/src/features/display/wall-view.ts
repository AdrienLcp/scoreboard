import type { Display } from '@scoreboard/protocol/event-setup'
import type { HallPlan } from '@scoreboard/protocol/hall-plan'
import type { TableNumber } from '@scoreboard/protocol/identifiers'
import type { WallView } from '@scoreboard/protocol/wall-view'

import {
  type WallFloor,
  type WallHall,
  wallFloorFor,
  wallHallFor
} from './wall-hall'
import type { WallRow } from './wall-rows'

/**
 * The view a screen asked for: its display's own, or the event's for the
 * screen showing every table, which has no display; `null` leaves it to the
 * plan.
 */
export const wallViewOf = ({
  display,
  wallView
}: {
  display: Pick<Display, 'view'> | undefined
  wallView?: WallView | null
}): WallView | null =>
  display === undefined ? (wallView ?? null) : (display.view ?? null)

/**
 * The encounters' wall as the hall when the screen asks for it or leaves it
 * to the plan, and the plan holds every encounter; `null` lays it out one
 * row per encounter.
 */
export const wallHallOn = ({
  plan,
  rows,
  view
}: {
  plan: HallPlan
  rows: readonly WallRow[]
  view: WallView | null
}): WallHall | null =>
  view === 'encounters' ? null : wallHallFor({ plan, rows })

/**
 * A tournament's tables as the hall when the screen asks for it or leaves it
 * to the plan, and the plan holds them; `null` lays them out one row per
 * pool.
 */
export const wallFloorOn = ({
  plan,
  tables,
  view
}: {
  plan: HallPlan
  tables: readonly TableNumber[]
  view: WallView | null
}): WallFloor | null =>
  view === 'encounters' ? null : wallFloorFor({ plan, tables })
