import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import {
  Disclosure as AriaDisclosure,
  DisclosurePanel as AriaDisclosurePanel,
  type DisclosurePanelProps,
  type DisclosureProps
} from 'react-aria-components'

import './disclosure.sass'

/** A block that opens in place to show its detail; its trigger is a `Button slot='trigger'`. */
export const Disclosure: React.FC<DisclosureProps> = ({
  className,
  ...props
}) => (
  <AriaDisclosure
    {...props}
    className={composeClassName(className, 'disclosure')}
  />
)

export const DisclosurePanel: React.FC<DisclosurePanelProps> = ({
  className,
  ...props
}) => (
  <AriaDisclosurePanel
    {...props}
    className={composeClassName(className, 'disclosure-panel')}
  />
)
