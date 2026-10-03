import type React from 'react'

import './main.sass'

const MAIN_ID = 'main'

/** The page's landmark: where a skip link points and focus lands after a navigation. */
export const Main: React.FC<
  Omit<React.ComponentProps<'main'>, 'id' | 'tabIndex'>
> = (props) => <main {...props} id={MAIN_ID} tabIndex={-1} />
