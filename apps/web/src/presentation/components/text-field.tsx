import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import {
  TextField as AriaTextField,
  type TextFieldProps
} from 'react-aria-components'

import './field.sass'

export const TextField: React.FC<TextFieldProps> = ({
  className,
  ...props
}) => (
  <AriaTextField {...props} className={composeClassName(className, 'field')} />
)

export { Description, FieldError, Input, Label } from './field'
export type { TextFieldProps }
