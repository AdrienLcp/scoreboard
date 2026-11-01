import type React from 'react'
import { useSyncExternalStore } from 'react'
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
  Popover
} from 'react-aria-components'

import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import './chooser.sass'

/** Below this width a chooser rises from the bottom edge instead of hanging under its trigger. */
const SHEET_QUERY = '(width < 40rem)'

const subscribeToSheetQuery = (onChange: () => void) => {
  const query = window.matchMedia(SHEET_QUERY)

  query.addEventListener('change', onChange)

  return () => query.removeEventListener('change', onChange)
}

const useIsSheet = (): boolean =>
  useSyncExternalStore(
    subscribeToSheetQuery,
    () => window.matchMedia(SHEET_QUERY).matches,
    () => false
  )

type ChooserProps = {
  children: React.ReactNode
  /** What choosing does, said under the options. */
  hint?: string
  onClose: () => void
  title: string
  trigger: HTMLElement
}

/**
 * A short list of choices opened from a button: under it on a wide screen,
 * above it when there is no room below, a bottom sheet on a phone.
 */
export const Chooser: React.FC<ChooserProps> = ({
  children,
  hint,
  onClose,
  title,
  trigger
}) => {
  const translate = useTranslate()
  const isSheet = useIsSheet()
  const closeWhenDismissed = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }
  const dialog = (
    <Dialog className='chooser-dialog'>
      <div className='chooser-head'>
        <Heading className='chooser-title' slot='title'>
          {title}
        </Heading>
        <AriaButton
          aria-label={translate('organiser.chooser.close')}
          className='chooser-close'
          onPress={onClose}
        >
          <Icon name='close' />
        </AriaButton>
      </div>
      <ul className='chooser-list'>{children}</ul>
      {hint === undefined ? null : <p className='chooser-hint'>{hint}</p>}
    </Dialog>
  )

  return isSheet ? (
    <ModalOverlay
      className='chooser-scrim'
      isDismissable
      isOpen
      onOpenChange={closeWhenDismissed}
    >
      <Modal className='chooser chooser-sheet'>{dialog}</Modal>
    </ModalOverlay>
  ) : (
    <Popover
      className='chooser'
      isOpen
      offset={8}
      onOpenChange={closeWhenDismissed}
      placement='bottom'
      triggerRef={{ current: trigger }}
    >
      {dialog}
    </Popover>
  )
}

type ChooserOptionProps = Omit<AriaButtonProps, 'className'> & {
  isCurrent: boolean
}

/** One choice of a {@link Chooser}, ringed when it is the one in place. */
export const ChooserOption: React.FC<ChooserOptionProps> = ({
  isCurrent,
  ...props
}) => (
  <li>
    <AriaButton
      {...props}
      aria-current={isCurrent || undefined}
      className='chooser-option'
    />
  </li>
)

/** The mark of the choice already in place. */
export const HereMark: React.FC = () => {
  const translate = useTranslate()

  return (
    <span className='chooser-here'>
      <Icon name='check' />
      {translate('organiser.chooser.here')}
    </span>
  )
}
