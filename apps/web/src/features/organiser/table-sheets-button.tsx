import type React from 'react'

import type { TableAccess } from '@scoreboard/protocol/event-snapshot'
import type { EventId } from '@scoreboard/protocol/identifiers'

import { useClubTranslate } from '@/features/club/use-club-translate'
import { pageOrigin } from '@/infrastructure/browser'
import {
  umpireEntryPathFor,
  umpirePathFor
} from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'

import { TableSheets } from './table-sheets'
import { usePrinting } from './use-printing'

type TableSheetsButtonProps = {
  accesses: readonly TableAccess[]
  eventId: EventId
  eventName: string
}

/** Prints one sheet per table, its umpire QR on it, from wherever the organiser stands. */
export const TableSheetsButton: React.FC<TableSheetsButtonProps> = ({
  accesses,
  eventId,
  eventName
}) => {
  const translate = useClubTranslate()
  const printing = usePrinting()

  return (
    <>
      <Button onPress={printing.print}>
        <Icon name='print' />
        {translate('organiser.hallStep.print', { count: accesses.length })}
      </Button>
      {printing.isPrinting ? (
        <TableSheets
          accesses={accesses}
          entryUrl={`${pageOrigin()}${umpireEntryPathFor(eventId)}`}
          eventName={eventName}
          urlOf={(access) =>
            `${pageOrigin()}${umpirePathFor({ code: access.code, eventId })}`
          }
        />
      ) : null}
    </>
  )
}
