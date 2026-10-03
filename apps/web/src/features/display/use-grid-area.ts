import { useLayoutEffect, useRef, useState } from 'react'

import type { GridArea } from './display-fit'

/**
 * At or under this window width the display stacks its tiles for scrolling
 * instead of fitting them to the screen; `display-page.sass` switches its
 * layout at the same width.
 */
const STACKED_UP_TO_PX = 720

export type MeasuredGrid = {
  area: GridArea | null
  isStacked: boolean
  /** Of the screen's height: legibility is judged against what the room sees. */
  viewportHeight: number
}

/** Measures the room the live grid is given, and follows it as the window changes. */
export const useGridArea = () => {
  const gridRef = useRef<HTMLElement>(null)
  const [measured, setMeasured] = useState<MeasuredGrid>({
    area: null,
    isStacked: false,
    viewportHeight: 0
  })

  useLayoutEffect(() => {
    const grid = gridRef.current

    if (grid === null) {
      return
    }

    const measure = (): void => {
      const width = grid.clientWidth
      const area = {
        gap: Number.parseFloat(getComputedStyle(grid).rowGap) || 0,
        height: grid.clientHeight,
        width
      }

      setMeasured((current) =>
        current.area?.width === area.width &&
        current.area.height === area.height &&
        current.area.gap === area.gap &&
        current.viewportHeight === window.innerHeight
          ? current
          : {
              area,
              isStacked: window.innerWidth <= STACKED_UP_TO_PX,
              viewportHeight: window.innerHeight
            }
      )
    }

    const observer = new ResizeObserver(measure)

    observer.observe(grid)
    measure()

    return () => observer.disconnect()
  }, [])

  return { gridRef, measured }
}
