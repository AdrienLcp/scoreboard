import type React from 'react'
import { useRef } from 'react'

import type { HallPlan } from '@scoreboard/protocol/hall-plan'
import type { TableNumber } from '@scoreboard/protocol/identifiers'

import {
  areaOf,
  type HallArea,
  isInTouchingBlock,
  reservedTablesOf,
  standingPairsOf,
  standingTablesOf
} from '@scoreboard/core/hall/hall-plan'

import { useClubTranslate } from '@/features/club/use-club-translate'
import { Icon } from '@/presentation/components/icon'
import { TableTop } from '@/presentation/components/table-top'

import { type BlockLabel, blockNameOf } from './plan-blocks'
import { floorStyleOf, percentOf, placedOn } from './plan-geometry'
import { PlanLinks } from './plan-links'
import {
  type PlanDrag,
  type PlanGestures,
  previewOf,
  usePlanDrag
} from './use-plan-drag'

import './plan-floor.sass'

/** A keyboard step moves a table half a metre, two and a half with Shift. */
const KEY_STEP_M = 0.5
const KEY_LEAP_M = 2.5

type PlanFloorProps = {
  /** Each block by its first table. */
  blocks: ReadonlyMap<TableNumber, BlockLabel>
  gestures: PlanGestures
  /** Draw the blocks that host encounters: off for a tournament. */
  hasBlocks: boolean
  /** Where the next table would go, drawn as a "+". */
  nextSpot: HallArea
  onAdd: () => void
  onPutAway: (table: TableNumber) => void
  onTurn: (table: TableNumber) => void
  /** Grown to hold the next table's spot. */
  plan: HallPlan
  playing: ReadonlySet<TableNumber>
  selected: TableNumber | null
}

const isLifted = (drag: PlanDrag | null, table: TableNumber) =>
  drag?.kind === 'tables' && drag.tables.includes(table)

/**
 * The hall seen from above, to set up: each table dragged where it stands,
 * aligning on the others; dropped on another, the two trade places; dropped
 * on the reserve, put away for the day. A block of two touching tables moves
 * by its handle, which also picks its encounter.
 */
export const PlanFloor: React.FC<PlanFloorProps> = ({
  blocks,
  gestures,
  hasBlocks,
  nextSpot,
  onAdd,
  onPutAway,
  onTurn,
  plan,
  playing,
  selected
}) => {
  const translate = useClubTranslate()
  const floor = useRef<HTMLElement>(null)
  const reserve = useRef<HTMLElement>(null)
  const { drag, handlers } = usePlanDrag({ floor, gestures, plan, reserve })
  const shown = previewOf(plan, drag)
  const reserved = reservedTablesOf(plan)
  const pairs = hasBlocks ? standingPairsOf(shown) : []
  const target = drag?.kind === 'tables' ? drag.target : null
  const lifted = drag?.kind === 'tables' ? drag.tables : []
  const isOverReserve = drag?.kind === 'tables' && drag.isOverReserve
  const movedLabel =
    drag?.kind === 'tables'
      ? drag.isBlock
        ? translate('organiser.plan.theBlock', {
            block: blockNameOf(drag.tables[0] ?? 1)
          })
        : translate('organiser.plan.theTable', { table: drag.tables[0] ?? 1 })
      : ''

  const onKeyDown = (event: React.KeyboardEvent, table: TableNumber) => {
    if (event.key === 'r' || event.key === 'R') {
      event.preventDefault()
      onTurn(table)

      return
    }

    const step = event.shiftKey ? KEY_LEAP_M : KEY_STEP_M
    const shift = {
      ArrowDown: [0, step],
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step]
    }[event.key]

    if (shift !== undefined) {
      event.preventDefault()
      gestures.onMove([table], shift[0] ?? 0, shift[1] ?? 0)
    }
  }

  return (
    <div className='plan' {...handlers}>
      <section
        aria-label={translate('organiser.hall.label')}
        className='plan-floor'
        ref={floor}
        style={floorStyleOf(plan)}
      >
        <PlanLinks pairs={pairs} plan={shown} />
        {drag !== null && drag.guideX !== null ? (
          <span
            aria-hidden='true'
            className='plan-guide'
            data-axis='x'
            style={{ left: percentOf(drag.guideX, plan.width) }}
          />
        ) : null}
        {drag !== null && drag.guideY !== null ? (
          <span
            aria-hidden='true'
            className='plan-guide'
            data-axis='y'
            style={{ top: percentOf(drag.guideY, plan.depth) }}
          />
        ) : null}
        {standingTablesOf(shown).map((hallTable) => {
          const { table } = hallTable
          const turnLabel = isInTouchingBlock(plan, table)
            ? translate('organiser.plan.turnBlock', {
                block: blockNameOf(table % 2 === 0 ? table - 1 : table)
              })
            : translate('organiser.plan.turnTable', { table })

          return (
            <div
              className='plan-table'
              data-dragging={isLifted(drag, table) || undefined}
              data-leaving={
                (isOverReserve && lifted.includes(table)) || undefined
              }
              data-plan-table={table}
              data-selected={selected === table || undefined}
              data-target={
                (target?.kind === 'table' && target.table === table) ||
                undefined
              }
              data-turned={hallTable.isTurned || undefined}
              key={table}
              style={placedOn(areaOf(hallTable), plan)}
            >
              <button
                aria-label={translate('organiser.plan.tableLabel', { table })}
                aria-pressed={selected === table}
                className='plan-table-open'
                onClick={(event) => {
                  if (event.detail === 0) {
                    gestures.onPickTable(table)
                  }
                }}
                onKeyDown={(event) => onKeyDown(event, table)}
                type='button'
              >
                <span className='plan-plate'>{table}</span>
                {playing.has(table) ? (
                  <span
                    className='plan-playing'
                    title={translate('organiser.plan.playing')}
                  />
                ) : null}
              </button>
              <span className='plan-table-actions'>
                <button
                  aria-label={translate('organiser.plan.putAwayTable', {
                    table
                  })}
                  className='plan-table-action'
                  data-plan-action='put-away'
                  onClick={() => onPutAway(table)}
                  title={translate('organiser.plan.putAway')}
                  type='button'
                >
                  <Icon name='close' />
                </button>
                <button
                  aria-label={turnLabel}
                  className='plan-table-action'
                  data-plan-action='turn'
                  data-turn
                  onClick={() => onTurn(table)}
                  title={turnLabel}
                  type='button'
                >
                  <Icon name='rotate' />
                </button>
              </span>
              <span className='plan-table-top'>
                <TableTop isTurned={hallTable.isTurned} />
              </span>
              <span className='plan-swap'>
                <Icon name='swap' />
                {translate('organiser.plan.swap')}
              </span>
            </div>
          )
        })}
        {pairs
          .filter((pair) => pair.isAdjacent)
          .map((pair) => {
            const [first] = pair.tables
            const block = blocks.get(first)
            const label = block?.encounter ?? null
            const colour = block?.colour ?? null

            return (
              <div
                className='plan-pair'
                data-dragging={
                  (drag?.kind === 'tables' &&
                    drag.isBlock &&
                    drag.tables[0] === first) ||
                  undefined
                }
                data-encounter={colour !== null || undefined}
                data-target={
                  (target?.kind === 'block' && target.first === first) ||
                  undefined
                }
                data-wide={pair.area.width >= pair.area.height || undefined}
                key={first}
                style={{
                  ...placedOn(pair.area, plan),
                  '--block': colour?.background,
                  '--on-block': colour?.text
                }}
              >
                <button
                  aria-haspopup='dialog'
                  aria-label={translate('organiser.plan.blockLabel', {
                    block: blockNameOf(first),
                    encounter: label ?? translate('organiser.plan.noEncounter')
                  })}
                  className='plan-handle'
                  data-plan-handle={first}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      gestures.onPickBlock(first, event.currentTarget)
                    }
                  }}
                  type='button'
                >
                  <Icon className='plan-handle-grip' name='grip' />
                  <b>{blockNameOf(first)}</b>
                  <span>
                    {label ?? translate('organiser.plan.noEncounter')}
                  </span>
                  <Icon className='plan-handle-caret' name='chevronDown' />
                </button>
              </div>
            )
          })}
        <button
          className='plan-add'
          data-plan-action='add'
          hidden={drag !== null}
          onClick={onAdd}
          style={placedOn(nextSpot, plan)}
          type='button'
        >
          <Icon name='plus' />
          <span>{translate('organiser.plan.add')}</span>
        </button>
      </section>
      <p className='plan-stands'>{translate('organiser.hall.stands')}</p>
      <section
        aria-label={translate('organiser.plan.reserveLabel')}
        className='plan-reserve'
        data-empty={(reserved.length === 0 && !isOverReserve) || undefined}
        data-target={isOverReserve || undefined}
        ref={reserve}
      >
        {isOverReserve ? (
          <span className='plan-reserve-note' data-drop>
            <Icon name='reserve' />
            {translate('organiser.plan.dropToPutAway', { what: movedLabel })}
          </span>
        ) : reserved.length === 0 ? (
          <span className='plan-reserve-note'>
            <Icon name='reserve' />
            {translate('organiser.plan.reserveEmpty')}
          </span>
        ) : (
          <>
            <span className='plan-reserve-title'>
              {translate('organiser.plan.reserve')}
            </span>
            <ul className='plan-chips'>
              {reserved.map(({ table }) => (
                <li key={table}>
                  <button
                    aria-label={translate('organiser.plan.putBackTable', {
                      table
                    })}
                    className='plan-chip'
                    data-lifted={
                      (drag?.kind === 'reserve' && drag.table === table) ||
                      undefined
                    }
                    data-plan-chip={table}
                    onClick={(event) => {
                      if (event.detail === 0) {
                        gestures.onPutBack(table)
                      }
                    }}
                    title={translate('organiser.plan.putBackHint')}
                    type='button'
                  >
                    <span className='plan-plate'>{table}</span>
                    <span className='plan-chip-top'>
                      <TableTop />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <span className='plan-reserve-hint'>
              {translate('organiser.plan.reserveHint')}
            </span>
          </>
        )}
      </section>
      {drag?.kind === 'reserve' && drag.at === null ? (
        <span
          aria-hidden='true'
          className='plan-ghost'
          style={{
            transform: `translate(${drag.pointer.x}px, ${drag.pointer.y}px)`
          }}
        >
          <span className='plan-plate'>{drag.table}</span>
          <span className='plan-chip-top'>
            <TableTop />
          </span>
        </span>
      ) : null}
    </div>
  )
}
