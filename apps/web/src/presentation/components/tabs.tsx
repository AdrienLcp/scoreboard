import { composeClassName } from '@adrienlcp/react-aria'
import type React from 'react'
import {
  Tab as AriaTab,
  TabList as AriaTabList,
  TabPanel as AriaTabPanel,
  type TabListProps,
  type TabPanelProps,
  type TabProps
} from 'react-aria-components'

import './tabs.sass'

/** Equal segments on one track: each tab is one way of looking at the same day. */
export const TabList = <T extends object>({
  className,
  ...props
}: TabListProps<T>) => (
  <AriaTabList {...props} className={composeClassName(className, 'tab-list')} />
)

export const Tab: React.FC<TabProps> = ({ className, ...props }) => (
  <AriaTab {...props} className={composeClassName(className, 'tab')} />
)

export const TabPanel: React.FC<TabPanelProps> = ({ className, ...props }) => (
  <AriaTabPanel
    {...props}
    className={composeClassName(className, 'tab-panel')}
  />
)

export { Tabs, type TabsProps } from 'react-aria-components'
