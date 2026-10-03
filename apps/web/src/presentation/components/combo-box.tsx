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

export { Input, Label } from './field'
export { ListBox, ListBoxItem, Popover } from './select'
