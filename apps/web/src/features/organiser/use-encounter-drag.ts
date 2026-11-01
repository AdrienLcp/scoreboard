import type React from 'react'
import { useRef, useState } from 'react'

import type { EncounterId, TableNumber } from '@scoreboard/protocol/identifiers'

import { blockOf } from '@scoreboard/core/hall/hall-plan'

/** How far a grip travels before a press becomes a drag. */
const DRAG_THRESHOLD_PX = 6

/** An encounter carried by its grip: where the pointer is and the block under it. */
export type EncounterDrag = {
  encounterId: EncounterId
  over: TableNumber | null
  x: number
  y: number
}

type Press = {
  encounterId: EncounterId
  hasMoved: boolean
  pointerId: number
  x: number
  y: number
}

const blockFirstOf = (element: Element): TableNumber | null => {
  const block =
    element.closest<HTMLElement>('[data-plan-block]')?.dataset.planBlock
  const table =
    element.closest<HTMLElement>('[data-plan-table]')?.dataset.planTable
  const first =
    block === undefined
      ? table === undefined
        ? Number.NaN
        : blockOf(Number(table))[0]
      : Number(block)

  return Number.isInteger(first) && first > 0 ? first : null
}

/** The first table of the block drawn under a point of the screen, inside `area`. */
const blockUnder = (
  area: HTMLElement | null,
  x: number,
  y: number
): TableNumber | null => {
  for (const element of document.elementsFromPoint(x, y)) {
    const first = area?.contains(element) ? blockFirstOf(element) : null

    if (first !== null) {
      return first
    }
  }

  return null
}

/**
 * Drags an encounter row by its grip onto a block of the plan drawn in
 * `area`: the block under the pointer is followed while it moves, and a drop
 * on one hands it over.
 */
export const useEncounterDrag = ({
  area,
  onDrop
}: {
  area: React.RefObject<HTMLElement | null>
  onDrop: (encounterId: EncounterId, first: TableNumber) => void
}) => {
  const [drag, setDrag] = useState<EncounterDrag | null>(null)
  const press = useRef<Press | null>(null)

  const end = (event: React.PointerEvent, isDrop: boolean) => {
    const current = press.current

    if (current === null || current.pointerId !== event.pointerId) {
      return
    }

    press.current = null
    setDrag(null)

    const first = current.hasMoved
      ? blockUnder(area.current, event.clientX, event.clientY)
      : null

    if (isDrop && first !== null) {
      onDrop(current.encounterId, first)
    }
  }

  const gripProps = (
    encounterId: EncounterId
  ): React.HTMLAttributes<HTMLElement> => ({
    onPointerCancel: (event) => end(event, false),
    onPointerDown: (event) => {
      if (event.button !== 0) {
        return
      }

      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      press.current = {
        encounterId,
        hasMoved: false,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY
      }
    },
    onPointerMove: (event) => {
      const current = press.current

      if (current === null || current.pointerId !== event.pointerId) {
        return
      }

      if (
        !current.hasMoved &&
        Math.hypot(event.clientX - current.x, event.clientY - current.y) <
          DRAG_THRESHOLD_PX
      ) {
        return
      }

      current.hasMoved = true
      setDrag({
        encounterId,
        over: blockUnder(area.current, event.clientX, event.clientY),
        x: event.clientX,
        y: event.clientY
      })
    },
    onPointerUp: (event) => end(event, true)
  })

  return { drag, gripProps }
}
