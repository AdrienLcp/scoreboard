import { copyText } from '@adrienlcp/browser'
import type React from 'react'
import { useState } from 'react'

import type { TableAccess } from '@scoreboard/protocol/event-snapshot'
import type { EventId } from '@scoreboard/protocol/identifiers'

import { useClubTranslate } from '@/features/club/use-club-translate'
import { pageOrigin } from '@/infrastructure/browser'
import {
  umpireEntryPathFor,
  umpirePathFor
} from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { CodeAndQr } from '@/presentation/components/code-and-qr'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink, TextLink } from '@/presentation/components/link'
import { LinkText } from '@/presentation/components/link-text'
import {
  ToggleButton,
  ToggleButtonGroup
} from '@/presentation/components/toggle-button-group'

import { TableSheets } from './table-sheets'
import { usePrinting } from './use-printing'

import './table-accesses.sass'

type TableAccessesProps = {
  accesses: readonly TableAccess[]
  eventId: EventId
  eventName: string
}

const umpireUrlOf = (access: TableAccess, eventId: EventId): string =>
  `${pageOrigin()}${umpirePathFor({ code: access.code, eventId })}`

const CopyLinkButton: React.FC<{ url: string }> = ({ url }) => {
  const translate = useClubTranslate()
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const isCopied = copiedUrl === url

  return (
    <Button
      onPress={async () => {
        const copied = await copyText(url)
        setCopiedUrl(copied.status === 'success' ? url : null)
      }}
      variant='quiet'
    >
      <Icon name={isCopied ? 'check' : 'copy'} />
      {translate(
        isCopied ? 'organiser.access.copied' : 'organiser.access.copy'
      )}
    </Button>
  )
}

const TableFocus: React.FC<{
  access: TableAccess
  eventId: EventId
  next: TableAccess | undefined
  onStep: (table: number) => void
  previous: TableAccess | undefined
}> = ({ access, eventId, next, onStep, previous }) => {
  const translate = useClubTranslate()
  const url = umpireUrlOf(access, eventId)

  return (
    <section aria-labelledby='access-focus-title' className='access-focus'>
      <header className='access-focus-head'>
        <Button
          aria-label={translate('organiser.access.previous')}
          isDisabled={previous === undefined}
          onPress={() => previous && onStep(previous.table)}
        >
          <Icon name='arrowLeft' />
        </Button>
        <h3 aria-live='polite' id='access-focus-title'>
          {translate('organiser.access.table', { table: access.table })}
        </h3>
        <Button
          aria-label={translate('organiser.access.next')}
          isDisabled={next === undefined}
          onPress={() => next && onStep(next.table)}
        >
          <Icon name='arrowRight' />
        </Button>
      </header>
      <CodeAndQr
        code={access.code}
        codeHint={translate('organiser.access.codeHint')}
        qrLabel={translate('organiser.access.qrLabel', { table: access.table })}
        scanHint={translate('organiser.access.scanHint')}
        url={url}
      />
      <div className='access-focus-actions'>
        <ButtonLink href={url} target='_blank' variant='quiet'>
          <Icon name='open' />
          {translate('organiser.access.openConsole')}
        </ButtonLink>
        <CopyLinkButton url={url} />
      </div>
    </section>
  )
}

/**
 * Each table's umpire code: a short list to pick from, then that one table's
 * QR code, large, so nobody scans the neighbour's. Every table prints on its
 * own sheet.
 */
export const TableAccesses: React.FC<TableAccessesProps> = ({
  accesses,
  eventId,
  eventName
}) => {
  const translate = useClubTranslate()
  const [pickedTable, setPickedTable] = useState(accesses[0]?.table ?? null)
  const printing = usePrinting()
  const index = Math.max(
    0,
    accesses.findIndex((access) => access.table === pickedTable)
  )
  const picked = accesses[index]
  const entryUrl = `${pageOrigin()}${umpireEntryPathFor(eventId)}`

  if (picked === undefined) {
    return null
  }

  return (
    <div className='table-accesses'>
      <div className='access-intro'>
        <p className='organiser-note'>
          {translate('organiser.access.explain')}{' '}
          <TextLink href={umpireEntryPathFor(eventId)} target='_blank'>
            <LinkText url={entryUrl} />
          </TextLink>
        </p>
        <Button onPress={printing.print}>
          <Icon name='print' />
          {translate('organiser.access.print')}
        </Button>
      </div>
      <div className='access-layout'>
        <ToggleButtonGroup
          aria-label={translate('organiser.access.tables')}
          className='access-tables'
          disallowEmptySelection
          onSelectionChange={(keys) => {
            const [key] = keys

            if (key !== undefined) {
              setPickedTable(Number(key))
            }
          }}
          selectedKeys={[String(picked.table)]}
          selectionMode='single'
        >
          {accesses.map((access) => (
            <ToggleButton
              className='access-table'
              id={String(access.table)}
              key={access.table}
            >
              <span className='access-table-name'>
                {translate('organiser.access.table', { table: access.table })}
              </span>
              <span className='access-table-code' translate='no'>
                {access.code}
              </span>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <TableFocus
          access={picked}
          eventId={eventId}
          next={accesses[index + 1]}
          onStep={setPickedTable}
          previous={accesses[index - 1]}
        />
      </div>
      {printing.isPrinting ? (
        <TableSheets
          accesses={accesses}
          entryUrl={entryUrl}
          eventName={eventName}
          urlOf={(access) => umpireUrlOf(access, eventId)}
        />
      ) : null}
    </div>
  )
}
