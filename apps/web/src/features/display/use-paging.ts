import { useEffect, useState } from 'react'

/** How long a page of tiles stays up before the next one; the page bar fills in this time. */
export const PAGE_MS = 12_000

/** Turns the pages of live tiles in a loop, one every `PAGE_MS`. */
export const usePaging = (pageCount: number): number => {
  const [index, setIndex] = useState(0)
  const page = index < pageCount ? index : 0

  useEffect(() => {
    if (pageCount < 2) {
      return
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % pageCount)
    }, PAGE_MS)

    return () => window.clearInterval(timer)
  }, [pageCount])

  return page
}
