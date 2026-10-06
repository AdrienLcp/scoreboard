import type React from 'react'

import './main.sass'

const MAIN_ID = 'main'

const keepBackgroundClicksInert = (
  event: React.MouseEvent<HTMLElement>
): void => {
  if (event.target === event.currentTarget) {
    event.preventDefault()
  }
}

/** The page's landmark: where a skip link points and focus lands after a navigation. */
export const Main: React.FC<
  Omit<React.ComponentProps<'main'>, 'id' | 'onMouseDown' | 'tabIndex'>
> = (props) => (
  <main
    {...props}
    id={MAIN_ID}
    onMouseDown={keepBackgroundClicksInert}
    tabIndex={-1}
  />
)
