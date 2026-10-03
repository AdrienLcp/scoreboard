import type React from 'react'
import { useLayoutEffect, useRef } from 'react'

/** The `<title>` the document was served with, found before React renders one. */
const servedTitle =
  typeof document === 'undefined'
    ? null
    : document.querySelector('head > title')

/** The tab's title for the page that renders it; one per screen. */
export const DocumentTitle: React.FC<{ children: string }> = ({ children }) => {
  const ownTitle = useRef<HTMLTitleElement>(null)

  useLayoutEffect(() => {
    if (servedTitle !== ownTitle.current) {
      servedTitle?.remove()
    }
  }, [])

  return <title ref={ownTitle}>{children}</title>
}
