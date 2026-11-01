import type React from 'react'

import type { PoolNumber } from '@scoreboard/protocol/championship'
import type { DirectoryTeam } from '@scoreboard/protocol/club-record'

import { paintOf } from '@/features/event/team-paint'

import './pool-team-mark.sass'

type PoolTeamMarkProps = {
  number: PoolNumber
  /** `undefined` while nobody holds the number. */
  team: DirectoryTeam | undefined
}

/** A team's number in its pool on its colour, as the calendar names it: "1", "8". */
export const PoolTeamMark: React.FC<PoolTeamMarkProps> = ({ number, team }) => {
  const paint = team === undefined ? null : paintOf(team)

  return (
    <span
      aria-hidden='true'
      className='pool-team-mark'
      data-empty={paint === null || undefined}
      data-white={paint?.isWhite || undefined}
      style={
        paint === null
          ? undefined
          : { background: paint.colour, color: paint.textColour }
      }
    >
      {number}
    </span>
  )
}
