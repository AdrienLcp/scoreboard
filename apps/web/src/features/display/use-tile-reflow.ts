import { type RefObject, useLayoutEffect, useRef } from 'react'

const RESIZED_FADE_MS = 420
const RESIZED_FADE_DELAY_MS = 160
const MOVED_PX = 0.5

/** A CSS `<time>` in milliseconds: `640ms`, `0.64s`; anything else is no motion. */
const millisecondsOf = (time: string): number => {
  const [, amount, unit] = /^\s*([\d.]+)(ms|s)\s*$/.exec(time) ?? []

  return amount === undefined ? 0 : Number(amount) * (unit === 's' ? 1000 : 1)
}

/**
 * Slides each tile from where it stood to where the new layout puts it (FLIP)
 * when a match starts or ends; a tile that changed size fades its content back
 * in rather than stretching it. A window resize moves nothing. The slide
 * takes the stylesheet's `--transition-slow` and `--ease-move`, so reduced
 * motion, which zeroes the duration, stills it.
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

    const style = getComputedStyle(grid)
    const reflowMs = millisecondsOf(style.getPropertyValue('--transition-slow'))
    const reflowEasing = style.getPropertyValue('--ease-move').trim()
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
