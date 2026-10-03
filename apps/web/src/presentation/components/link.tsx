import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import { Link as AriaLink, type LinkProps } from 'react-aria-components'

import type { ButtonVariant } from './button'

import './button.sass'
import './link.sass'

/** An inline link inside running text or a list. */
export const TextLink: React.FC<LinkProps> = ({ className, ...props }) => (
  <AriaLink {...props} className={composeClassName(className, 'text-link')} />
)

type ButtonLinkProps = LinkProps & {
  /** Default: `'secondary'`. */
  variant?: ButtonVariant
}

/** A navigation drawn as a button: the action moves the user to another screen. */
export const ButtonLink: React.FC<ButtonLinkProps> = ({
  className,
  variant = 'secondary',
  ...props
}) => (
  <AriaLink
    {...props}
    className={composeClassName(className, 'button', variant)}
  />
)

export { AriaLink as Link, type LinkProps }
