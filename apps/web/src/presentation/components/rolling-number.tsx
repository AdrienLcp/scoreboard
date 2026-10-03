import type React from 'react'
import { useState } from 'react'

import './rolling-number.sass'

type Shown = {
  current: number
  previous: number | null
  turn: number
}

type RollingNumberProps = {
  value: number
}

/**
 * A figure that pushes the old value out as the new one comes in: up when it
 * grows, down when it shrinks, as after an undo. Still on first render.
 */
export const RollingNumber: React.FC<RollingNumberProps> = ({ value }) => {
  const [shown, setShown] = useState<Shown>({
    current: value,
    previous: null,
    turn: 0
  })

  if (shown.current !== value) {
    setShown({ current: value, previous: shown.current, turn: shown.turn + 1 })
  }

  const isShrinking = shown.previous !== null && shown.previous > shown.current

  return (
    <span
      className='rolling-number'
      data-direction={isShrinking ? 'down' : 'up'}
    >
      {shown.previous === null ? null : (
        <span
          aria-hidden='true'
          className='leaving'
          key={`leaving-${shown.turn}`}
        >
          {shown.previous}
        </span>
      )}
      <span
        className={shown.previous === null ? undefined : 'arriving'}
        key={`arriving-${shown.turn}`}
      >
        {shown.current}
      </span>
    </span>
  )
}
