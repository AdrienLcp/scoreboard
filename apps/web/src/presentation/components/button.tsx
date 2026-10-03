import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps
} from 'react-aria-components'

import './button.sass'

/**
 * How loud a button is:
 * - `'primary'` — the one action the screen exists for, in the live accent
 * - `'secondary'` — an outlined action beside it
 * - `'quiet'` — a borderless action in a list or a toolbar
 * - `'stop'` — an action that ends or removes something, set apart in white
 */
export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'stop'

export type ButtonProps = AriaButtonProps & {
  /** Default: `'secondary'`. */
  variant?: ButtonVariant
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'secondary',
  ...props
}) => (
  <AriaButton
    {...props}
    className={composeClassName(className, 'button', variant)}
  />
)

/** A bare react-aria button for a control that draws its own look, like a point target. */
export { AriaButton as PlainButton }
