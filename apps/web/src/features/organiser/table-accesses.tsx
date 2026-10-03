import type React from 'react'

import type { TableAccess } from '@scoreboard/protocol/event-snapshot'
import type { EventId } from '@scoreboard/protocol/identifiers'

import { pageOrigin } from '@/infrastructure/browser'
import {
  displayPathFor,
  umpireEntryPathFor,
  umpirePathFor
} from '@/infrastructure/router/navigation'
import { Link } from '@/presentation/components/link'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

type TableAccessesProps = {
  accesses: readonly TableAccess[]
  eventId: EventId
}

/** Each table's umpire code and the link its QR code would carry, and the big screen's link. */
export const TableAccesses: React.FC<TableAccessesProps> = ({
  accesses,
  eventId
}) => {
  const translate = useTranslate()

  return (
    <>
      <p>
        <Link href={displayPathFor(eventId)}>
          {translate('organiser.access.display')}
        </Link>
        {' · '}
        <Link href={umpireEntryPathFor(eventId)}>
          {translate('organiser.access.umpireEntry')}
        </Link>
      </p>
      <dl>
        {accesses.map((access) => {
          const umpirePath = umpirePathFor({ code: access.code, eventId })

          return (
            <div key={access.table}>
              <dt>{translate('table.name', { number: access.table })}</dt>
              <dd>
                <code>{access.code}</code>{' '}
                <Link href={umpirePath}>{`${pageOrigin()}${umpirePath}`}</Link>
              </dd>
            </div>
          )
        })}
      </dl>
    </>
  )
}
