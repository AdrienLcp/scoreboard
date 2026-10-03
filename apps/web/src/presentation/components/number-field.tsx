import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import {
  NumberField as AriaNumberField,
  type NumberFieldProps
} from 'react-aria-components'

import './field.sass'

export const NumberField: React.FC<NumberFieldProps> = ({
  className,
  ...props
}) => (
  <AriaNumberField
    {...props}
    className={composeClassName(className, 'field')}
  />
)

export { Group } from 'react-aria-components'

export { Description, FieldError, Input, Label } from './field'
export type { NumberFieldProps }
