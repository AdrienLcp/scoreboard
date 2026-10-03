import type React from 'react'

export const MAIN_ID = 'main'

type MainProps = {
  children: React.ReactNode
}

/** The page's landmark: where a skip link points and focus lands after a navigation. */
export const Main: React.FC<MainProps> = ({ children }) => (
  <main id={MAIN_ID} tabIndex={-1}>
    {children}
  </main>
)
