import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import {
  ToggleButton as AriaToggleButton,
  ToggleButtonGroup as AriaToggleButtonGroup,
  type ToggleButtonGroupProps,
  type ToggleButtonProps
} from 'react-aria-components'

import './toggle-button-group.sass'

/** A short row of options, one of which is picked: who stops, and why. */
export const ToggleButtonGroup: React.FC<ToggleButtonGroupProps> = ({
  className,
  ...props
}) => (
  <AriaToggleButtonGroup
    {...props}
    className={composeClassName(className, 'toggle-button-group')}
  />
)

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  className,
  ...props
}) => (
  <AriaToggleButton
    {...props}
    className={composeClassName(className, 'toggle-button')}
  />
)
