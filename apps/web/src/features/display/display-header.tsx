import type React from 'react'

import type { InstantMs } from '@scoreboard/protocol/scoring-event'

import { toDate } from '@/infrastructure/dates'
import type { SocketStatus } from '@/infrastructure/messaging/use-event-socket'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-context'
import { socketStatusKey } from '@/presentation/i18n/translation'

import { PAGE_MS } from './use-paging'

import './display-header.sass'

/** Where the screen stands in its loop of pages, when the live tiles need more than one. */
export type PageIndicator = {
  count: number
  firstTable: number
  index: number
  lastTable: number
}

type DisplayHeaderProps = {
  eventName: string
  nowMs: InstantMs
  owner: string
  page: PageIndicator | null
  /** This screen's share of the tables, when the organiser split them. */
  scope: string | null
  status: SocketStatus
}

/** Who runs the day, which tables this screen shows, and the hall's time. */
export const DisplayHeader: React.FC<DisplayHeaderProps> = ({
  eventName,
  nowMs,
  owner,
  page,
  scope,
  status
}) => {
  const translate = useTranslate()
  const isPaged = page !== null && page.count > 1

  return (
    <header className='display-header'>
      <div className='display-owner'>
        <h1>{owner}</h1>
        <p>{eventName}</p>
      </div>
      {scope === null && !isPaged ? null : (
        <div className='display-scope'>
          <p>
            {[
              scope,
              isPaged
                ? translate('display.page', {
                    count: page.count,
                    first: page.firstTable,
                    index: page.index + 1,
                    last: page.lastTable
                  })
                : null
            ]
              .filter((part) => part !== null)
              .join(' · ')}
          </p>
          {isPaged ? (
            <span
              aria-hidden='true'
              className='page-bar'
              key={page.index}
              style={{ '--page-ms': `${PAGE_MS}ms` }}
            >
              <span />
            </span>
          ) : null}
        </div>
      )}
      <div className='display-when'>
        {status === 'open' ? null : (
          <p className='display-offline' role='status'>
            <Icon name='wifiOff' />
            {translate(socketStatusKey(status))}
          </p>
        )}
        <p className='display-date'>
          {translate('display.date', { at: toDate(nowMs) })}
        </p>
        <time className='display-clock'>
          {translate('display.clock', { at: toDate(nowMs) })}
        </time>
      </div>
    </header>
  )
}
