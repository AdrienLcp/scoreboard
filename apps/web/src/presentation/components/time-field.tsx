import { composeClassName } from '@adrienlcp/react-aria'
import type { Time } from '@internationalized/date'
import type React from 'react'
import {
  TimeField as AriaTimeField,
  type TimeFieldProps as AriaTimeFieldProps,
  DateInput,
  DateSegment
} from 'react-aria-components'

import { Label } from './field'

import './field.sass'
import './time-field.sass'

type TimeFieldProps = Omit<
  AriaTimeFieldProps<Time>,
  'children' | 'granularity' | 'hourCycle'
> & {
  label: React.ReactNode
}

/**
 * A time of day as two figures, `HH h MM`: digits type, arrows step, and the
 * day it falls on comes from elsewhere.
 */
export const TimeField: React.FC<TimeFieldProps> = ({
  className,
  label,
  ...props
}) => (
  <AriaTimeField
    {...props}
    className={composeClassName(className, 'field time-field')}
    granularity='minute'
    hourCycle={24}
    shouldForceLeadingZeros
  >
    <Label>{label}</Label>
    <DateInput className='field-input time-field-input'>
      {(segment) =>
        segment.type === 'literal' ? (
          <span aria-hidden='true' className='time-field-separator'>
            {segment.text.includes(':') ? 'h' : segment.text}
          </span>
        ) : (
          <DateSegment className='time-field-segment' segment={segment} />
        )
      }
    </DateInput>
  </AriaTimeField>
)

export type { TimeFieldProps }
