import type React from 'react'
import { useRef, useState } from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type {
  PublicSnapshot,
  TableAccess
} from '@scoreboard/protocol/event-snapshot'
import type {
  EventId,
  MatchId,
  TableNumber
} from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'

import { hallPlanOf, standingTablesOf } from '@scoreboard/core/hall/hall-plan'

import { currentMatchOn } from '@/features/event/table-match'
import { displayPathFor } from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink } from '@/presentation/components/link'
import { TableTop } from '@/presentation/components/table-top'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { LiveFloor } from './live-floor'
import { LiveRows } from './live-rows'
import { hasPlayBegun, liveTableStateOf } from './live-state'
import { TableMatchPanel } from './table-match-panel'
import { TableSheetsButton } from './table-sheets-button'

import './live-step.sass'

type LiveStepProps = {
  accesses: readonly TableAccess[]
  event: PublicSnapshot
  eventId: EventId
  onRecord: (matchId: MatchId, event: ScoringEvent) => void
  onSave: (setup: EventSetup) => boolean
  setup: EventSetup
}

/** Before the first point: how a match starts, the tables' QR sheets to print and the wall to look at. */
const NothingStarted: React.FC<{
  accesses: readonly TableAccess[]
  eventId: EventId
  eventName: string
}> = ({ accesses, eventId, eventName }) => {
  const translate = useTranslate()

  return (
    <section aria-labelledby='live-empty-title' className='live-empty'>
      <span className='live-empty-drawing'>
        <TableTop isIdle />
      </span>
      <h2 className='live-empty-title' id='live-empty-title'>
        {translate('organiser.live.empty.title')}
      </h2>
      <p className='live-empty-explain'>
        {translate('organiser.live.empty.explain')}
      </p>
      <div className='live-empty-actions'>
        <TableSheetsButton
          accesses={accesses}
          eventId={eventId}
          eventName={eventName}
        />
        <ButtonLink
          href={displayPathFor(eventId)}
          target='_blank'
          variant='quiet'
        >
          <Icon name='display' />
          {translate('organiser.live.empty.wall')}
        </ButtonLink>
      </div>
    </section>
  )
}

/**
 * The day as it is played: the hall with each table's score, and beside it
 * every table in a row, the matches no table holds first. A table tapped on
 * the plan or in its row opens what can change on it: its score, its umpire.
 * Before the first point, how the day starts.
 */
export const LiveStep: React.FC<LiveStepProps> = ({
  accesses,
  event,
  eventId,
  onRecord,
  onSave,
  setup
}) => {
  const translate = useTranslate()
  const [selected, setSelected] = useState<TableNumber | null>(null)
  const sheet = useRef<HTMLElement>(null)
  const standing = standingTablesOf(hallPlanOf(setup)).map(
    (hallTable) => hallTable.table
  )
  const listed = event.tables
    .map((view) => view.number)
    .filter(
      (table) =>
        standing.includes(table) ||
        liveTableStateOf(event, table).kind !== 'free'
    )
    .toSorted((one, other) => one - other)
  const selectedTable =
    selected !== null && listed.includes(selected) ? selected : null

  if (!hasPlayBegun(event)) {
    return (
      <NothingStarted
        accesses={accesses}
        eventId={eventId}
        eventName={setup.name}
      />
    )
  }

  const pick = (table: TableNumber) => {
    const next = selectedTable === table ? null : table
    setSelected(next)

    if (next !== null) {
      requestAnimationFrame(() =>
        sheet.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      )
    }
  }

  return (
    <div className='live-step'>
      <section aria-labelledby='live-floor-title' className='live-main'>
        <h2 className='live-heading' id='live-floor-title'>
          {translate('organiser.live.title')}
        </h2>
        <LiveFloor
          event={event}
          onPickTable={pick}
          selected={selectedTable}
          setup={setup}
          variant='live'
        />
      </section>
      <aside className='live-side'>
        {selectedTable === null ? null : (
          <section
            aria-labelledby='live-sheet-title'
            className='live-sheet'
            ref={sheet}
          >
            <header className='live-sheet-head'>
              <h3 className='live-sheet-title' id='live-sheet-title'>
                {translate('organiser.access.table', { table: selectedTable })}
              </h3>
              <Button
                aria-label={translate('organiser.live.closeTable', {
                  table: selectedTable
                })}
                onPress={() => setSelected(null)}
                variant='quiet'
              >
                <Icon name='close' />
              </Button>
            </header>
            {currentMatchOn(event, selectedTable) === null ? (
              <p className='live-sheet-note'>
                {translate('organiser.live.free')}
              </p>
            ) : (
              <TableMatchPanel
                event={event}
                key={selectedTable}
                onRecord={onRecord}
                onSaveSetup={(next) => {
                  onSave(next)
                }}
                setup={setup}
                table={selectedTable}
              />
            )}
          </section>
        )}
        <section aria-labelledby='live-rows-title' className='live-panel'>
          <h2 className='live-heading' id='live-rows-title'>
            {translate('organiser.live.byTable')}
          </h2>
          <LiveRows
            event={event}
            onPick={pick}
            selected={selectedTable}
            tables={listed}
          />
        </section>
      </aside>
    </div>
  )
}
