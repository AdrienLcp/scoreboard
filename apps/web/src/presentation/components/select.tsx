import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import {
  Button as AriaButton,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  Popover as AriaPopover,
  Select as AriaSelect,
  type ListBoxItemProps,
  type ListBoxProps,
  type PopoverProps,
  type SelectProps,
  SelectValue
} from 'react-aria-components'

import { Icon } from './icon'

import './field.sass'
import './select.sass'

export const Select = <T extends object>({
  className,
  ...props
}: SelectProps<T>) => (
  <AriaSelect {...props} className={composeClassName(className, 'field')} />
)

/** The closed select: its value and a chevron. */
export const SelectTrigger: React.FC = () => (
  <AriaButton className='select-trigger'>
    <SelectValue className='select-value' />
    <Icon name='chevronDown' />
  </AriaButton>
)

export const Popover: React.FC<PopoverProps> = ({ className, ...props }) => (
  <AriaPopover {...props} className={composeClassName(className, 'popover')} />
)

export const ListBox = <T extends object>({
  className,
  ...props
}: ListBoxProps<T>) => (
  <AriaListBox {...props} className={composeClassName(className, 'list-box')} />
)

export const ListBoxItem: React.FC<ListBoxItemProps> = ({
  className,
  ...props
}) => (
  <AriaListBoxItem
    {...props}
    className={composeClassName(className, 'list-box-item')}
  />
)

export { Label } from './field'
