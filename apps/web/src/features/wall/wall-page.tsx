import type React from 'react'

import { pageOrigin } from '@/infrastructure/browser'
import {
  displayOfPathFor,
  displayPathFor,
  useReplaceWith,
  wallPairingPathFor
} from '@/infrastructure/router/navigation'
import { BrandMark } from '@/presentation/components/brand-mark'
import { CodeAndQr } from '@/presentation/components/code-and-qr'
import { Main } from '@/presentation/components/main'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { useWallPairing } from './use-wall-pairing'

import './wall-page.sass'

/**
 * What a TV opens first: a code and a QR code for the organiser, then the
 * event's display as soon as they claim it. Several screens pair the same
 * event one after the other.
 */
export const WallPage: React.FC = () => {
  const translate = useTranslate()
  const replaceWith = useReplaceWith()
  const view = useWallPairing(({ displayId, eventId }) =>
    replaceWith(
      displayId === null
        ? displayPathFor(eventId)
        : displayOfPathFor({ displayId, eventId })
    )
  )

  return (
    <Main className='wall-page'>
      <DocumentTitle>{translate('wall.title')}</DocumentTitle>
      <header className='wall-header'>
        <BrandMark />
      </header>
      <div className='wall-body'>
        <h1>{translate('wall.title')}</h1>
        {view.status === 'waiting' ? (
          <CodeAndQr
            code={view.code}
            codeHint={translate('wall.codeHint')}
            qrLabel={translate('wall.qrLabel')}
            scanHint={translate('wall.scanHint')}
            url={`${pageOrigin()}${wallPairingPathFor(view.code)}`}
          />
        ) : (
          <p className='wall-status' role='status'>
            {translate(
              view.status === 'offline' ? 'wall.offline' : 'wall.opening'
            )}
          </p>
        )}
      </div>
    </Main>
  )
}
