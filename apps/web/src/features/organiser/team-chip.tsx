import type React from 'react'

import type { PublicSnapshot } from '@scoreboard/protocol/event-snapshot'

import {
  DEFAULT_OPPONENT_COLOUR,
  textColourOn
} from '@scoreboard/core/club/team-colours'

import './team-chip.sass'

type TeamChipProps = {
  colour: string
  name: string
}

/** The colour a team wears today; white when it has none. */
export const teamColourOf = (event: PublicSnapshot, teamId: string): string =>
  event.teams.find((team) => team.id === teamId)?.colour ??
  DEFAULT_OPPONENT_COLOUR

/** A team's name on its own colour, a white team ringed so it reads on white. */
export const TeamChip: React.FC<TeamChipProps> = ({ colour, name }) => (
  <span
    className='team-chip'
    data-white={colour.toUpperCase() === DEFAULT_OPPONENT_COLOUR || undefined}
    style={{ '--team': colour, '--team-ink': textColourOn(colour) }}
  >
    {name}
  </span>
)
