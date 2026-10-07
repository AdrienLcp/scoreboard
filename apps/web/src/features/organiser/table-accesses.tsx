import { copyText } from '@adrienlcp/browser'
import type React from 'react'
import { useState } from 'react'

import type { TableAccess } from '@scoreboard/protocol/event-snapshot'
import type { EventId } from '@scoreboard/protocol/identifiers'

import { pageOrigin } from '@/infrastructure/browser'
import {
  umpireEntryPathFor,
  umpirePathFor
} from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { TextLink } from '@/presentation/components/link'
import { QrCode } from '@/presentation/components/qr-code'
import { TableNumber } from '@/presentation/components/table-number'
import { useTranslate } from '@/presentation/i18n/i18n-context'

type TableAccessesProps = {
  accesses: readonly TableAccess[]
  eventId: EventId
}

const AccessRow: React.FC<{ access: TableAccess; eventId: EventId }> = ({
  access,
  eventId
}) => {
  const translate = useTranslate()
  const [isCopied, setIsCopied] = useState(false)
  const url = `${pageOrigin()}${umpirePathFor({ code: access.code, eventId })}`

  return (
    <li className='access-row'>
      <TableNumber number={access.table} />
      <QrCode
        label={translate('organiser.access.qrLabel', { table: access.table })}
        url={url}
      />
      <div className='access-text'>
        <p className='access-code'>{access.code}</p>
        <div className='access-actions'>
          <TextLink href={url} target='_blank'>
            {translate('organiser.access.openConsole')}
          </TextLink>
          <Button
            onPress={async () => {
              const copied = await copyText(url)
              setIsCopied(copied.status === 'success')
            }}
            variant='quiet'
          >
            <Icon name={isCopied ? 'check' : 'copy'} />
            {translate(
              isCopied ? 'organiser.access.copied' : 'organiser.access.copy'
            )}
          </Button>
        </div>
      </div>
    </li>
  )
}

/** Each table's umpire code and the QR code that opens its console, to print or hand over. */
export const TableAccesses: React.FC<TableAccessesProps> = ({
  accesses,
  eventId
}) => {
  const translate = useTranslate()

  return (
    <div className='organiser-stack'>
      <p className='organiser-note'>
        {translate('organiser.access.explain')}{' '}
        <TextLink href={umpireEntryPathFor(eventId)} target='_blank'>
          {`${pageOrigin()}${umpireEntryPathFor(eventId)}`.replace(
            /^https?:\/\//,
            ''
          )}
        </TextLink>
      </p>
      <ul className='access-grid'>
        {accesses.map((access) => (
          <AccessRow access={access} eventId={eventId} key={access.table} />
        ))}
      </ul>
    </div>
  )
}
