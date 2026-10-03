import type React from 'react'

import type { SocketStatus } from '@/infrastructure/messaging/use-event-socket'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { socketStatusKey } from '@/presentation/i18n/translation'

import { connectionStateOf } from './connection-state'

import './connection-badge.sass'

type ConnectionBadgeProps = {
  pending: number
  status: SocketStatus
}

/** Whether the points reach the server, and how many wait on this device when they do not. */
export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({
  pending,
  status
}) => {
  const translate = useTranslate()
  const connection = connectionStateOf({ pending, status })

  return (
    <p className='connection-badge' data-kind={connection.kind} role='status'>
      {connection.kind === 'online' ? (
        <>
          <span aria-hidden='true' className='connection-dot' />
          {translate('umpire.connection.online')}
        </>
      ) : null}
      {connection.kind === 'sending' ? (
        <>
          <Icon className='connection-spin' name='sync' />
          {translate('umpire.connection.sending', {
            count: connection.pending
          })}
        </>
      ) : null}
      {connection.kind === 'offline' ? (
        <>
          <Icon name='wifiOff' />
          {connection.pending === 0
            ? translate(socketStatusKey(status))
            : translate('umpire.connection.offline', {
                count: connection.pending
              })}
        </>
      ) : null}
      {connection.kind === 'refused' ? (
        <>
          <Icon name='alert' />
          {translate(socketStatusKey('refused'))}
        </>
      ) : null}
    </p>
  )
}
