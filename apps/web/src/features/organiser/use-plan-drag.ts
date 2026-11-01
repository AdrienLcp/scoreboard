import type React from 'react'
import { useRef, useState } from 'react'

import type { HallPlan, HallTable } from '@scoreboard/protocol/hall-plan'
import type { TableNumber } from '@scoreboard/protocol/identifiers'

import {
  areaContains,
  areaOf,
  blockOf,
  hallTableOf,
  snapArea,
  standingPairsOf,
  standingTablesOf,
  unionOf
} from '@scoreboard/core/hall/hall-plan'

/** A press that travels less than this is a tap. */
const DRAG_THRESHOLD_PX = 5
/** The reserve takes a drop this close to its edge. */
const RESERVE_REACH_PX = 8

export type DropTarget =
  | { first: TableNumber; kind: 'block' }
  | { kind: 'table'; table: TableNumber }

type Guides = { guideX: number | null; guideY: number | null }

export type PlanDrag =
  | (Guides & {
      isBlock: boolean
      isOverReserve: boolean
      kind: 'tables'
      shiftX: number
      shiftY: number
      tables: TableNumber[]
      target: DropTarget | null
    })
  | (Guides & {
      /** Where it would stand, `null` while the pointer is off the floor. */
      at: { x: number; y: number } | null
      kind: 'reserve'
      pointer: { x: number; y: number }
      table: TableNumber
    })

export type PlanGestures = {
  onMove: (
    tables: readonly TableNumber[],
    shiftX: number,
    shiftY: number
  ) => void
  onPickBlock: (first: TableNumber, handle: HTMLElement) => void
  onPickTable: (table: TableNumber) => void
  onPutAway: (tables: readonly TableNumber[]) => void
  onPutBack: (table: TableNumber, at?: { x: number; y: number }) => void
  onSwap: (target: DropTarget, tables: readonly TableNumber[]) => void
}

type Press = {
  handle: HTMLElement | null
  pointerId: number
  source:
    | { kind: 'reserve'; table: TableNumber }
    | { isBlock: boolean; kind: 'tables'; tables: TableNumber[] }
  startX: number
  startY: number
}

const tableOfElement = (element: Element | null, attribute: string) => {
  const value = element?.getAttribute(attribute)

  return value === null || value === undefined ? null : Number(value)
}

const isWithin = (
  element: Element | null,
  event: React.PointerEvent,
  reach = 0
): boolean => {
  if (element === null) {
    return false
  }

  const box = element.getBoundingClientRect()

  return (
    event.clientX >= box.left - reach &&
    event.clientX <= box.right + reach &&
    event.clientY >= box.top - reach &&
    event.clientY <= box.bottom + reach
  )
}

/**
 * The plan's pointer gestures, for a mouse and a finger alike: a table, a
 * block by its handle or a reserve chip is dragged with magnetism; a press
 * that does not travel is a tap.
 */
export const usePlanDrag = ({
  floor,
  gestures,
  plan,
  reserve
}: {
  floor: React.RefObject<HTMLElement | null>
  gestures: PlanGestures
  /** The plan as drawn, its depth grown to hold the next table's spot. */
  plan: HallPlan
  reserve: React.RefObject<HTMLElement | null>
}) => {
  const press = useRef<Press | null>(null)
  const latest = useRef<PlanDrag | null>(null)
  const [drag, setShownDrag] = useState<PlanDrag | null>(null)
  const setDrag = (next: PlanDrag | null) => {
    latest.current = next
    setShownDrag(next)
  }

  const metresAt = (event: React.PointerEvent) => {
    const box = floor.current?.getBoundingClientRect()
    const unit = box === undefined ? 1 : box.width / plan.width

    return {
      unit,
      x: (event.clientX - (box?.left ?? 0)) / unit,
      y: (event.clientY - (box?.top ?? 0)) / unit
    }
  }

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    const target = event.target instanceof Element ? event.target : null

    if (event.button !== 0 || target?.closest('[data-plan-action]')) {
      return
    }

    const chip = target?.closest('[data-plan-chip]') ?? null
    const handle = target?.closest<HTMLElement>('[data-plan-handle]') ?? null
    const card = target?.closest('[data-plan-table]') ?? null
    const chipTable = tableOfElement(chip, 'data-plan-chip')
    const handleTable = tableOfElement(handle, 'data-plan-handle')
    const cardTable = tableOfElement(card, 'data-plan-table')
    const base = {
      handle,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY
    }

    if (chipTable !== null) {
      press.current = {
        ...base,
        source: { kind: 'reserve', table: chipTable }
      }
    } else if (handleTable !== null) {
      press.current = {
        ...base,
        source: { isBlock: true, kind: 'tables', tables: blockOf(handleTable) }
      }
    } else if (cardTable !== null) {
      press.current = {
        ...base,
        source: { isBlock: false, kind: 'tables', tables: [cardTable] }
      }
    } else {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const dragReserve = (event: React.PointerEvent, table: TableNumber) => {
    const here = hallTableOf(plan, table)

    if (here === undefined) {
      return
    }

    const pointer = { x: event.clientX, y: event.clientY }

    if (!isWithin(floor.current, event)) {
      setDrag({
        at: null,
        guideX: null,
        guideY: null,
        kind: 'reserve',
        pointer,
        table
      })

      return
    }

    const area = areaOf(here)
    const metres = metresAt(event)
    const snapped = snapArea({
      area: {
        ...area,
        x: metres.x - area.width / 2,
        y: metres.y - area.height / 2
      },
      others: standingTablesOf(plan, [table]).map(areaOf),
      plan
    })

    setDrag({
      at: { x: snapped.x, y: snapped.y },
      guideX: snapped.guideX,
      guideY: snapped.guideY,
      kind: 'reserve',
      pointer,
      table
    })
  }

  const dragTables = (
    event: React.PointerEvent,
    current: Press,
    tables: TableNumber[],
    isBlock: boolean
  ) => {
    const moved = tables.flatMap((table) => hallTableOf(plan, table) ?? [])

    if (moved.length === 0) {
      return
    }

    const metres = metresAt(event)
    const group = moved.map(areaOf).reduce(unionOf)
    const snapped = snapArea({
      area: {
        ...group,
        x: group.x + (event.clientX - current.startX) / metres.unit,
        y: group.y + (event.clientY - current.startY) / metres.unit
      },
      others: standingTablesOf(plan, tables).map(areaOf),
      plan
    })
    const isOverReserve = isWithin(reserve.current, event, RESERVE_REACH_PX)
    const target = isOverReserve
      ? null
      : isBlock
        ? blockTargetAt(plan, tables, metres)
        : tableTargetAt(plan, tables, metres)
    const isQuiet = isOverReserve || target !== null

    setDrag({
      guideX: isQuiet ? null : snapped.guideX,
      guideY: isQuiet ? null : snapped.guideY,
      isBlock,
      isOverReserve,
      kind: 'tables',
      shiftX: snapped.x - group.x,
      shiftY: snapped.y - group.y,
      tables,
      target
    })
  }

  const onPointerMove = (event: React.PointerEvent) => {
    const current = press.current

    if (current === null || event.pointerId !== current.pointerId) {
      return
    }

    if (
      latest.current === null &&
      Math.hypot(
        event.clientX - current.startX,
        event.clientY - current.startY
      ) < DRAG_THRESHOLD_PX
    ) {
      return
    }

    if (current.source.kind === 'reserve') {
      dragReserve(event, current.source.table)
    } else {
      dragTables(event, current, current.source.tables, current.source.isBlock)
    }
  }

  const finish = (event: React.PointerEvent, isCancelled: boolean) => {
    const current = press.current

    if (current === null || event.pointerId !== current.pointerId) {
      return
    }

    const dropped = latest.current

    press.current = null
    setDrag(null)

    if (isCancelled) {
      return
    }

    const { source } = current

    if (dropped === null) {
      if (source.kind === 'reserve') {
        gestures.onPutBack(source.table)
      } else if (source.isBlock && current.handle !== null) {
        gestures.onPickBlock(source.tables[0] ?? 1, current.handle)
      } else if (source.tables[0] !== undefined) {
        gestures.onPickTable(source.tables[0])
      }

      return
    }

    if (dropped.kind === 'reserve') {
      if (dropped.at !== null) {
        gestures.onPutBack(dropped.table, dropped.at)
      }

      return
    }

    if (dropped.isOverReserve) {
      gestures.onPutAway(dropped.tables)
    } else if (dropped.target !== null) {
      gestures.onSwap(dropped.target, dropped.tables)
    } else {
      gestures.onMove(dropped.tables, dropped.shiftX, dropped.shiftY)
    }
  }

  return {
    drag,
    handlers: {
      onPointerCancel: (event: React.PointerEvent) => finish(event, true),
      onPointerDown,
      onPointerMove,
      onPointerUp: (event: React.PointerEvent) => finish(event, false)
    }
  }
}

const blockTargetAt = (
  plan: HallPlan,
  tables: readonly TableNumber[],
  point: { x: number; y: number }
): DropTarget | null => {
  const hit = standingPairsOf(plan).find(
    (pair) =>
      pair.isAdjacent &&
      !tables.includes(pair.tables[0]) &&
      areaContains(pair.area, point)
  )

  return hit === undefined ? null : { first: hit.tables[0], kind: 'block' }
}

const tableTargetAt = (
  plan: HallPlan,
  tables: readonly TableNumber[],
  point: { x: number; y: number }
): DropTarget | null => {
  const hit = standingTablesOf(plan, tables).find((table) =>
    areaContains(areaOf(table), point)
  )

  return hit === undefined ? null : { kind: 'table', table: hit.table }
}

const placeOf = ({ isTurned, x, y }: HallTable) => ({ isTurned, x, y })

/**
 * The plan as the drag shows it: the dragged tables where they would land,
 * and the table or block they hover already sliding into the place they
 * would leave.
 */
export const previewOf = (plan: HallPlan, drag: PlanDrag | null): HallPlan => {
  if (drag === null) {
    return plan
  }

  const places = new Map<TableNumber, Partial<HallTable>>()

  if (drag.kind === 'reserve') {
    if (drag.at !== null) {
      places.set(drag.table, { ...drag.at, isHidden: false })
    }
  } else {
    for (const table of drag.tables) {
      const here = hallTableOf(plan, table)

      if (here !== undefined) {
        places.set(table, { x: here.x + drag.shiftX, y: here.y + drag.shiftY })
      }
    }

    const origin = (table: TableNumber | undefined) => {
      const here = table === undefined ? undefined : hallTableOf(plan, table)

      return here === undefined ? undefined : placeOf(here)
    }

    if (drag.target?.kind === 'table') {
      const from = origin(drag.tables[0])

      if (from !== undefined) {
        places.set(drag.target.table, from)
      }
    }

    if (drag.target?.kind === 'block') {
      for (const [index, table] of blockOf(drag.target.first).entries()) {
        const from = origin(drag.tables[index])

        if (from !== undefined) {
          places.set(table, from)
        }
      }
    }
  }

  return {
    ...plan,
    tables: plan.tables.map((table) => ({
      ...table,
      ...places.get(table.table)
    }))
  }
}
