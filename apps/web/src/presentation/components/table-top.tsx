import type React from 'react'

import './table-top.sass'

type TableTopProps = {
  isIdle?: boolean
  /** Its long side runs from the far wall towards the stands. */
  isTurned?: boolean
}

/** A table-tennis table seen from above, as the hall plan draws it: its blue top, white lines and net. */
export const TableTop: React.FC<TableTopProps> = ({
  isIdle = false,
  isTurned = false
}) => (
  <svg
    aria-hidden='true'
    className='table-top'
    data-idle={isIdle || undefined}
    focusable='false'
    overflow='visible'
    viewBox={isTurned ? '0 0 152.5 274' : '0 0 274 152.5'}
  >
    <g transform={isTurned ? 'translate(152.5 0) rotate(90)' : undefined}>
      <rect className='table-top-surface' height='152.5' width='274' />
      <rect
        className='table-top-line'
        fill='none'
        height='134.5'
        width='256'
        x='9'
        y='9'
      />
      <line
        className='table-top-centre'
        x1='11'
        x2='263'
        y1='76.25'
        y2='76.25'
      />
      <rect className='table-top-net' height='170.5' width='6' x='134' y='-9' />
      <rect className='table-top-net' height='7' width='14' x='130' y='-12' />
      <rect className='table-top-net' height='7' width='14' x='130' y='157.5' />
    </g>
  </svg>
)
