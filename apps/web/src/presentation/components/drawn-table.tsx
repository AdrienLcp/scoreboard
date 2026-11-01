import type React from 'react'

import { withClass } from './class-names'

import './drawn-table.sass'

const NET_THREADS = [82, 98, 114, 130, 146, 162, 178, 194, 210, 226]

type DrawnTableProps = {
  /** Laid over the drawing; it may place itself with `--table-width` and `--table-side`. */
  children?: React.ReactNode
  className?: string
  /** A table nobody plays on: its top turns grey. */
  isIdle?: boolean
}

/**
 * The table-tennis table seen from the hall, in perspective, on its floor.
 * The drawing keeps its proportion, centred in whatever box it is given, and
 * tells what it lays over it where the table stands: `--table-width` is the
 * drawing's width, `--table-side` the floor showing on each side of it.
 */
export const DrawnTable: React.FC<DrawnTableProps> = ({
  children,
  className,
  isIdle = false
}) => (
  <div
    className={withClass('drawn-table', className)}
    data-idle={isIdle || undefined}
  >
    <svg
      aria-hidden='true'
      className='drawn-table-art'
      focusable='false'
      preserveAspectRatio='none'
      viewBox='0 0 600 300'
    >
      <path
        className='drawn-table-legs'
        d='M70 255 L58 300 M530 255 L542 300 M232 250 L230 284 M368 250 L370 284'
      />
      <polygon
        className='drawn-table-surface'
        points='104,96 496,96 572,252 28,252'
      />
      <polygon
        className='drawn-table-front'
        points='28,252 572,252 572,262 28,262'
      />
      <polygon
        className='drawn-table-edge'
        points='104,96 496,96 572,252 28,252'
      />
      <line className='drawn-table-centre' x1='66' x2='534' y1='174' y2='174' />
      <path
        className='drawn-table-net'
        d='M294 74 L306 74 L306 236 L294 236 Z'
      />
      <path
        className='drawn-table-threads'
        d={NET_THREADS.map((y) => `M296 ${y} L304 ${y}`).join(' ')}
      />
    </svg>
    {children}
  </div>
)
