import type React from 'react'

import { TEAM_COLOURS, textColourOn } from '@scoreboard/core/club/team-colours'

import { Icon } from '@/presentation/components/icon'
import {
  ToggleButton,
  ToggleButtonGroup
} from '@/presentation/components/toggle-button-group'

type ColourSwatchesProps = {
  label: string
  onChange: (colour: string) => void
  selected: string
}

/** The club's team colours as squares to tap: a colour is picked, never typed. */
export const ColourSwatches: React.FC<ColourSwatchesProps> = ({
  label,
  onChange,
  selected
}) => (
  <ToggleButtonGroup
    aria-label={label}
    className='colour-swatches'
    disallowEmptySelection
    onSelectionChange={(keys) => {
      const [colour] = [...keys]

      if (typeof colour === 'string') {
        onChange(colour)
      }
    }}
    selectedKeys={[selected.toUpperCase()]}
    selectionMode='single'
  >
    {TEAM_COLOURS.map((colour) => (
      <ToggleButton
        aria-label={colour}
        className='colour-swatch'
        id={colour}
        key={colour}
        style={{ background: colour, color: textColourOn(colour) }}
      >
        {colour === selected.toUpperCase() ? <Icon name='check' /> : null}
      </ToggleButton>
    ))}
  </ToggleButtonGroup>
)
