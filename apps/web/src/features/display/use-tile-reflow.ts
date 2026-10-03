import { type RefObject, useLayoutEffect, useRef } from 'react'

import { prefersReducedMotion } from '@/infrastructure/browser'

const REFLOW_MS = 640
const REFLOW_EASING = 'cubic-bezier(0.22, 0.8, 0.18, 1)'
const RESIZED_FADE_MS = 420
const RESIZED_FADE_DELAY_MS = 160
const MOVED_PX = 0.5

/**
 * Slides each tile from where it stood to where the new layout puts it (FLIP)
 * when a match starts or ends; a tile that changed size fades its content back
 * in rather than stretching it. A window resize moves nothing.
 */
export const useTileReflow = (
  gridRef: RefObject<HTMLElement | null>,
  layoutKey: string
): void => {
  const lastRects = useRef(new Map<string, DOMRect>())
  const lastKey = useRef(layoutKey)

  useLayoutEffect(() => {
    const grid = gridRef.current

    if (grid === null) {
      return
    }

    const isNewLayout = lastKey.current !== layoutKey
    const shouldMove = isNewLayout && !prefersReducedMotion()
    const rects = new Map<string, DOMRect>()

    for (const tile of grid.querySelectorAll<HTMLElement>('[data-table]')) {
      const table = tile.dataset.table ?? ''
      const last = tile.getBoundingClientRect()
      const first = lastRects.current.get(table)

      rects.set(table, last)

      if (!shouldMove || first === undefined) {
        continue
      }

      const dx = first.left - last.left
      const dy = first.top - last.top

      if (Math.abs(dx) > MOVED_PX || Math.abs(dy) > MOVED_PX) {
        tile.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)`, zIndex: 1 },
            { transform: 'none', zIndex: 1 }
          ],
          { duration: REFLOW_MS, easing: REFLOW_EASING }
        )
      }

      const isResized =
        Math.abs(first.width - last.width) > 1 ||
        Math.abs(first.height - last.height) > 1

      if (isResized) {
        tile.firstElementChild?.animate([{ opacity: 0.25 }, { opacity: 1 }], {
          delay: RESIZED_FADE_DELAY_MS,
          duration: RESIZED_FADE_MS,
          easing: 'ease-out',
          fill: 'backwards'
        })
      }
    }

    lastRects.current = rects
    lastKey.current = layoutKey
  })
}
