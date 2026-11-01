import { composeClassName } from '@adrienlcp/react-aria'
import {
  ComboBox as AriaComboBox,
  type ComboBoxProps
} from 'react-aria-components'

import './field.sass'
import './combo-box.sass'

/** A field that suggests as it is typed into, like a player's name. */
export const ComboBox = <T extends object>({
  className,
  ...props
}: ComboBoxProps<T>) => (
  <AriaComboBox
    {...props}
    className={composeClassName(className, 'combo-box')}
  />
)

/** Wraps the input and what stands beside it, so the list opens under the whole box at its width. */
export { Group } from 'react-aria-components'

export { Input, Label } from './field'
export { ListBox, ListBoxItem, Popover } from './select'
