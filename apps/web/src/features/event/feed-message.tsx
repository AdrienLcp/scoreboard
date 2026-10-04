import type React from 'react'

import type { ProtocolErrorMessage } from '@scoreboard/protocol/server-message'

import type { SocketStatus } from '@/infrastructure/messaging/use-event-socket'
import { paths } from '@/infrastructure/router/navigation'
import { BrandMark } from '@/presentation/components/brand-mark'
import { Icon } from '@/presentation/components/icon'
import { TextLink } from '@/presentation/components/link'
import { Main } from '@/presentation/components/main'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-context'
import {
  protocolErrorKey,
  socketStatusKey
} from '@/presentation/i18n/translation'

import './feed-message.sass'

type FeedMessageProps = {
  error?: ProtocolErrorMessage | null
  /** Said instead of the connection's state, when the page knows what is wrong. */
  message?: string
  status?: SocketStatus
  /** The tab's title. */
  title: string
}

/** What a screen shows before its event arrives, or when it cannot: one calm sentence. */
export const FeedMessage: React.FC<FeedMessageProps> = ({
  error = null,
  message,
  status,
  title
}) => {
  const translate = useTranslate()
  const failure =
    message ?? (error === null ? null : translate(protocolErrorKey(error.code)))
  const isWaiting = failure === null && status !== 'refused'

  return (
    <Main className='feed-message'>
      <DocumentTitle>{title}</DocumentTitle>
      <div className='feed-message-body'>
        <BrandMark />
        {isWaiting ? (
          <p className='feed-message-text' role='status'>
            <Icon className='feed-message-sync' name='sync' />
            {translate(socketStatusKey(status ?? 'connecting'))}
          </p>
        ) : (
          <>
            <p className='feed-message-text' role='alert'>
              <Icon name='alert' />
              {failure ?? translate(socketStatusKey('refused'))}
            </p>
            <TextLink href={paths.home}>{translate('notFound.home')}</TextLink>
          </>
        )}
      </div>
    </Main>
  )
}
