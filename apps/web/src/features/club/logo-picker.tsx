import type { Result } from '@adrienlcp/result'
import type React from 'react'
import { useState } from 'react'
import { FileTrigger } from 'react-aria-components'

import type { LogoUrl } from '@scoreboard/protocol/logo'

import { Button, PlainButton } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import type { LogoUploadError } from './use-club'

import './logo-picker.sass'

type LogoPickerProps = {
  /** Beside the logo: the club's name on the page head, a label in an opponent's block. */
  children: React.ReactNode
  logoUrl: LogoUrl | null
  name: string
  onPick: (file: File) => Promise<Result<void, LogoUploadError>>
  onRemove: () => void
}

type PickStatus = 'idle' | 'sending' | LogoUploadError

const failureKeys = {
  not_an_image: 'club.logo.notAnImage',
  offline: 'club.offline',
  refused: 'club.logo.refused'
} as const

/**
 * A club's logo as a square to tap: empty, it asks for a picture; filled, a
 * tap swaps it. The picture is resized on the device before it leaves.
 */
export const LogoPicker: React.FC<LogoPickerProps> = ({
  children,
  logoUrl,
  name,
  onPick,
  onRemove
}) => {
  const translate = useTranslate()
  const [status, setStatus] = useState<PickStatus>('idle')

  return (
    <div className='logo-picker'>
      <FileTrigger
        acceptedFileTypes={['image/*']}
        onSelect={async (files) => {
          const file = files?.item(0) ?? null

          if (file === null) {
            return
          }

          setStatus('sending')
          const picked = await onPick(file)
          setStatus(picked.status === 'success' ? 'idle' : picked.error)
        }}
      >
        <PlainButton
          aria-label={translate(
            logoUrl === null ? 'club.logo.add' : 'club.logo.change',
            { name }
          )}
          className='logo-picker-slot'
          data-empty={logoUrl === null || undefined}
          isPending={status === 'sending'}
        >
          {logoUrl === null ? (
            <>
              <Icon name='image' />
              <span>{translate('club.logo.title')}</span>
            </>
          ) : (
            <img alt='' src={logoUrl} />
          )}
        </PlainButton>
      </FileTrigger>
      <div className='logo-picker-side'>
        {children}
        {status === 'sending' ? (
          <p aria-live='polite' className='logo-picker-note'>
            {translate('club.logo.sending')}
          </p>
        ) : null}
        {status !== 'idle' && status !== 'sending' ? (
          <p className='logo-picker-alert' role='alert'>
            <Icon name='alert' />
            {translate(failureKeys[status])}
          </p>
        ) : null}
        {logoUrl !== null && status !== 'sending' ? (
          <Button
            className='logo-picker-remove'
            onPress={onRemove}
            variant='quiet'
          >
            <Icon name='close' />
            {translate('club.logo.remove')}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
