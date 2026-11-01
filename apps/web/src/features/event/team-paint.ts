import type { Team } from '@scoreboard/protocol/event-setup'

import {
  DEFAULT_OPPONENT_COLOUR,
  textColourOn
} from '@scoreboard/core/club/team-colours'

/** A team as the screens paint it: its colour and the text that reads on it. */
export type TeamPaint = {
  colour: string
  /** White, the opponents' default: it needs an edge to hold on a white ground. */
  isWhite: boolean
  name: string
  textColour: string
}

/** How a team is painted: its colour or the opponents' white, and the text that reads on it. */
export const paintOf = (
  team: Pick<Team, 'colour' | 'name'> | undefined
): TeamPaint => {
  const colour = team?.colour ?? DEFAULT_OPPONENT_COLOUR

  return {
    colour,
    isWhite: colour.toUpperCase() === DEFAULT_OPPONENT_COLOUR,
    name: team?.name ?? '',
    textColour: textColourOn(colour)
  }
}
