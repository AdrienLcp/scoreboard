import type React from 'react'
import { useState } from 'react'

import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

type ConfirmButtonProps = {
  /** What the second press does, named: "Retirer Camille Huet". */
  confirmLabel: string
  label: string
  onConfirm: () => void
}

/**
 * A removal that takes two presses: the first only turns the button into a
 * confirmation beside a way back, so a slip of the finger removes nothing.
 */
export const ConfirmButton: React.FC<ConfirmButtonProps> = ({
  confirmLabel,
  label,
  onConfirm
}) => {
  const translate = useTranslate()
  const [isAsking, setIsAsking] = useState(false)

  if (!isAsking) {
    return (
      <Button
        aria-label={confirmLabel}
        onPress={() => setIsAsking(true)}
        variant='quiet'
      >
        {label}
      </Button>
    )
  }

  return (
    <span className='confirm-pair'>
      <Button onPress={() => setIsAsking(false)} variant='quiet'>
        {translate('organiser.keep')}
      </Button>
      <Button
        onPress={() => {
          setIsAsking(false)
          onConfirm()
        }}
        variant='stop'
      >
        <Icon name='close' />
        {confirmLabel}
      </Button>
    </span>
  )
}
