import type React from 'react'
import { createPortal } from 'react-dom'

import type { TableAccess } from '@scoreboard/protocol/event-snapshot'

import { useClubTranslate } from '@/features/club/use-club-translate'
import { DrawnTable } from '@/presentation/components/drawn-table'
import { LinkText } from '@/presentation/components/link-text'
import { QrCode } from '@/presentation/components/qr-code'

import './table-sheets.sass'

type TableSheetsProps = {
  accesses: readonly TableAccess[]
  /** Where an umpire types a code by hand. */
  entryUrl: string
  eventName: string
  urlOf: (access: TableAccess) => string
}

/**
 * One printed page per table, to lay on it: its name, the drawn table, its
 * umpire QR code and its code. Drawn beside the app, and the only thing printed while it is there.
 */
export const TableSheets: React.FC<TableSheetsProps> = ({
  accesses,
  entryUrl,
  eventName,
  urlOf
}) => {
  const translate = useClubTranslate()

  return createPortal(
    <div className='table-sheets'>
      {accesses.map((access) => (
        <article className='table-sheet' key={access.table}>
          <p className='table-sheet-event'>{eventName}</p>
          <h1>
            {translate('organiser.access.table', { table: access.table })}
          </h1>
          <DrawnTable className='table-sheet-drawing' />
          <QrCode
            label={translate('organiser.access.qrLabel', {
              table: access.table
            })}
            url={urlOf(access)}
          />
          <p className='table-sheet-scan'>
            {translate('organiser.access.sheet.scan')}
          </p>
          <div className='table-sheet-code'>
            <p>{translate('organiser.access.sheet.type')}</p>
            <strong translate='no'>{access.code}</strong>
            <small>
              <LinkText url={entryUrl} />
            </small>
          </div>
        </article>
      ))}
    </div>,
    document.body
  )
}
