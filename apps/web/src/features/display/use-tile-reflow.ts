import { readDurationSeconds } from '@adrienlcp/browser'
import { type RefObject, useLayoutEffect, useRef } from 'react'

const MOVED_PX = 0.5
const MS_PER_SECOND = 1000

const readDurationMs = (element: Element, property: `--${string}`): number =>
  readDurationSeconds(element, property) * MS_PER_SECOND

/**
 * Slides each tile from where it stood to where the new layout puts it (FLIP)
 * when a match starts or ends; a tile that changed size fades its content back
 * in rather than stretching it. A window resize moves nothing. The slide
 * takes the stylesheet's `--transition-slow` and `--ease-move`, the fade its
 * `--transition-base` after `--transition-fast`, so reduced motion, which
 * zeroes the durations, stills both.
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

    const reflowMs = readDurationMs(grid, '--transition-slow')
    const reflowEasing = getComputedStyle(grid)
      .getPropertyValue('--ease-move')
      .trim()
    const fadeMs = readDurationMs(grid, '--transition-base')
    const fadeDelayMs = readDurationMs(grid, '--transition-fast')
    const isNewLayout = lastKey.current !== layoutKey
    const shouldMove = isNewLayout && reflowMs > 0
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

      // The tile travelling furthest crosses the most neighbours: it rides on top.
      const travelLayer = Math.round(Math.hypot(dx, dy))

      if (Math.abs(dx) > MOVED_PX || Math.abs(dy) > MOVED_PX) {
        tile.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)`, zIndex: travelLayer },
            { transform: 'none', zIndex: travelLayer }
          ],
          { duration: reflowMs, easing: reflowEasing }
        )
      }

      const isResized =
        Math.abs(first.width - last.width) > 1 ||
        Math.abs(first.height - last.height) > 1

      if (isResized) {
        tile.firstElementChild?.animate([{ opacity: 0.25 }, { opacity: 1 }], {
          delay: fadeDelayMs,
          duration: fadeMs,
          easing: 'ease-out',
          fill: 'backwards'
        })
      }
    }

    lastRects.current = rects
    lastKey.current = layoutKey
  })
}
