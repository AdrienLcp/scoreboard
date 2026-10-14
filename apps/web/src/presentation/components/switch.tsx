import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import {
  Switch as AriaSwitch,
  type SwitchProps as AriaSwitchProps
} from 'react-aria-components'

import './switch.sass'

type SwitchProps = Omit<AriaSwitchProps, 'children'> & {
  /** The label, read with the switch and pressed like it. */
  children: React.ReactNode
}

/** An on/off setting that applies at once, its track drawn before the label. */
export const Switch: React.FC<SwitchProps> = ({
  children,
  className,
  ...props
}) => (
  <AriaSwitch {...props} className={composeClassName(className, 'switch')}>
    <span aria-hidden='true' className='track'>
      <span className='thumb' />
    </span>
    <span className='switch-label'>{children}</span>
  </AriaSwitch>
)
