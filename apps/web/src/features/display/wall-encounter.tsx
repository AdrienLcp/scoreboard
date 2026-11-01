import type React from 'react'

import type { Score } from '@scoreboard/protocol/side'
import { sides } from '@scoreboard/protocol/side'

import type { TeamPaint } from './wall-rows'

import './wall-encounter.sass'

type WallEncounterProps = {
  away: TeamPaint
  home: TeamPaint
  points: Score
}

/** The start of an encounter's row: each team on its colour, with the parties it has won. */
export const WallEncounter: React.FC<WallEncounterProps> = ({
  away,
  home,
  points
}) => (
  <div className='wall-encounter'>
    {sides.map((side) => {
      const team = side === 'home' ? home : away

      return (
        <p
          className='wall-team'
          data-white={team.isWhite || undefined}
          key={side}
          style={{ '--on-team': team.textColour, '--team': team.colour }}
        >
          <span className='wall-team-name'>{team.name}</span>
          <b className='wall-team-score'>{points[side]}</b>
        </p>
      )
    })}
  </div>
)
