import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import {
  FieldError as AriaFieldError,
  Input as AriaInput,
  Label as AriaLabel,
  type FieldErrorProps,
  type InputProps,
  type LabelProps,
  Text,
  type TextProps
} from 'react-aria-components'

import { withClass } from './class-names'

import './field.sass'

/** A field's name, above its control. */
export const Label: React.FC<LabelProps> = ({ className, ...props }) => (
  <AriaLabel {...props} className={withClass('field-label', className)} />
)

export const Input: React.FC<InputProps> = ({ className, ...props }) => (
  <AriaInput
    {...props}
    className={composeClassName(className, 'field-input')}
  />
)

/** What the field expects, under its control. */
export const Description: React.FC<Omit<TextProps, 'slot'>> = ({
  className,
  ...props
}) => (
  <Text
    {...props}
    className={withClass('field-description', className)}
    slot='description'
  />
)

/** What is wrong with the value, and how to put it right. */
export const FieldError: React.FC<FieldErrorProps> = ({
  className,
  ...props
}) => (
  <AriaFieldError
    {...props}
    className={composeClassName(className, 'field-error')}
  />
)
