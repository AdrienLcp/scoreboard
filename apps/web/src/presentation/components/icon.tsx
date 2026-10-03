import type React from 'react'

import './icon.sass'

/**
 * The app's authored icons, on a 24-unit grid with a 2-unit round stroke. The
 * serve mark and the star are filled: they read as a state, not an action.
 */
const STROKES = {
  alert: (
    <>
      <circle cx='12' cy='12' r='8.5' />
      <path d='M12 7.5v5.5' />
      <circle cx='12' cy='16.3' fill='currentColor' r='0.6' />
    </>
  ),
  arrowLeft: <path d='M19 12H5M11 6l-6 6 6 6' />,
  arrowRight: <path d='M5 12h14M13 6l6 6-6 6' />,
  check: <path d='M4.5 12.5l5 5 10-11' />,
  chevronDown: <path d='M6 9.5l6 6 6-6' />,
  close: <path d='M6.5 6.5l11 11M17.5 6.5l-11 11' />,
  copy: (
    <>
      <rect height='11' rx='2' width='11' x='9' y='9' />
      <path d='M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3' />
    </>
  ),
  display: (
    <>
      <rect height='12' rx='2' width='18' x='3' y='4.5' />
      <path d='M9 20h6M12 16.5V20' />
    </>
  ),
  flag: <path d='M5 21V4M5 4h11l-2 4 2 4H5' />,
  minus: <path d='M6 12h12' />,
  open: (
    <path d='M14 5h5v5M19 5l-8 8M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4' />
  ),
  plus: <path d='M12 5v14M5 12h14' />,
  search: (
    <>
      <circle cx='11' cy='11' r='6.5' />
      <path d='M16 16l4.5 4.5' />
    </>
  ),
  starOutline: (
    <path d='M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z' />
  ),
  swap: <path d='M4 8h15l-4-4M20 16H5l4 4' />,
  sync: (
    <>
      <path d='M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3' />
      <path d='M18 3v4h-4M6 21v-4h4' />
    </>
  ),
  undo: (
    <>
      <path d='M9 14L4 9l5-5' />
      <path d='M4 9h10a6 6 0 0 1 0 12h-3' />
    </>
  ),
  wifiOff: (
    <>
      <path d='M3 3l18 18M8.6 16a5 5 0 0 1 6.8 0M5.5 12.5a9.5 9.5 0 0 1 4-2.3M2.5 9a14 14 0 0 1 4.3-2.8M13.6 10.2a9.5 9.5 0 0 1 4.9 2.3M11 5.1A14 14 0 0 1 21.5 9' />
      <circle cx='12' cy='19.4' fill='currentColor' r='0.9' />
    </>
  )
} satisfies Record<string, React.ReactNode>

const FILLS = {
  serve: <path d='M5 3l16 9-16 9z' />,
  star: (
    <path d='M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z' />
  )
} satisfies Record<string, React.ReactNode>

export type IconName = keyof typeof STROKES | keyof typeof FILLS

const isFilled = (name: IconName): name is keyof typeof FILLS => name in FILLS

type IconProps = {
  className?: string
  name: IconName
}

/** A decorative icon: the control or text beside it carries the meaning. */
export const Icon: React.FC<IconProps> = ({ className, name }) => (
  <svg
    aria-hidden='true'
    className={className === undefined ? 'icon' : `icon ${className}`}
    data-filled={isFilled(name) || undefined}
    focusable='false'
    viewBox='0 0 24 24'
  >
    {isFilled(name) ? FILLS[name] : STROKES[name]}
  </svg>
)
