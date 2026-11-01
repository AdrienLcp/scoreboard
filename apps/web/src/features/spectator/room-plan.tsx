import type React from 'react'
import { useRef, useState } from 'react'

import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { PlayerId, TableNumber } from '@scoreboard/protocol/identifiers'

import { useTranslate } from '@/presentation/i18n/i18n-context'

import type { RoomLayout } from './room-layout'
import { RoomTable } from './room-table'

import './room-plan.sass'

/** Up to this many tables the plan reads without a pinch; past it, everything shrinks with its table. */
const LEGIBLE_TABLES = 8

/** A column of the plan nobody stands on: the aisle between two blocks of tables. */
const AISLE_TRACK = 'minmax(0.5rem, 0.25fr)'

type RoomPlanProps = {
  followed: readonly PlayerId[]
  layout: RoomLayout
  /** The match's card, opened: what a tap on its table shows below the plan. */
  renderMatch: (match: MatchView) => React.ReactNode
  snapshot: PublicSnapshot
}

/**
 * The hall seen from above on a visitor's phone, the stands at the bottom as
 * on the club's own plan: each table with its live score, a tap on one opens
 * its match below.
 */
export const RoomPlan: React.FC<RoomPlanProps> = ({
  followed,
  layout,
  renderMatch,
  snapshot
}) => {
  const translate = useTranslate()
  const [selected, setSelected] = useState<TableNumber | null>(null)
  const detail = useRef<HTMLDivElement>(null)
  const selectedTable = layout.tables.find((table) => table.table === selected)
  const selectedMatch =
    selectedTable === undefined
      ? null
      : (selectedTable.live ?? selectedTable.next)

  const select = (table: TableNumber) => {
    setSelected(selected === table ? null : table)
    requestAnimationFrame(() =>
      detail.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    )
  }

  return (
    <div className='room-plan'>
      <section
        aria-label={translate('spectator.room.label')}
        className='room-floor'
        data-crowded={layout.tables.length > LEGIBLE_TABLES || undefined}
        style={{
          '--room-columns': layout.columns
            .map((hasTables) => (hasTables ? 'minmax(0, 1fr)' : AISLE_TRACK))
            .join(' ')
        }}
      >
        {layout.tables.map((roomTable) => (
          <RoomTable
            followed={followed}
            isSelected={roomTable.table === selected}
            key={roomTable.table}
            onPress={() => select(roomTable.table)}
            roomTable={roomTable}
            snapshot={snapshot}
          />
        ))}
        <p className='room-stands' style={{ '--room-row': layout.rows + 1 }}>
          {translate('spectator.room.stands')}
        </p>
      </section>
      <div className='room-detail' ref={detail}>
        {selectedTable === undefined ? (
          <p className='room-hint'>{translate('spectator.room.hint')}</p>
        ) : selectedMatch === null ? (
          <p className='room-hint'>
            {translate('spectator.room.noMatch', {
              table: selectedTable.table
            })}
          </p>
        ) : (
          renderMatch(selectedMatch)
        )}
      </div>
    </div>
  )
}
