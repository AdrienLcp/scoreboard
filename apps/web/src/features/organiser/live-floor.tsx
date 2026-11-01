import type React from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { HallPlan, HallTable } from '@scoreboard/protocol/hall-plan'
import type { TableNumber } from '@scoreboard/protocol/identifiers'
import { type Side, sides } from '@scoreboard/protocol/side'

import { isDoublesLabel } from '@scoreboard/core/encounter/encounter-sheet'
import {
  areaOf,
  hallPlanOf,
  standingPairsOf,
  standingTablesOf
} from '@scoreboard/core/hall/hall-plan'

import { sideName } from '@/features/event/participant-names'
import { wallCallOf } from '@/features/event/sheet-call'
import { sidePaintOf } from '@/features/spectator/room-layout'
import { Icon } from '@/presentation/components/icon'
import { TableTop } from '@/presentation/components/table-top'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { LivePill } from './live-pill'
import { type LiveTableState, liveTableStateOf } from './live-state'
import { blockLabelsOf, blockNameOf } from './plan-blocks'
import { floorStyleOf, placedOn, tablesAlongTopOf } from './plan-geometry'
import { PlanLinks } from './plan-links'

import './plan-floor.sass'
import './live-floor.sass'

export type LiveFloorProps = {
  event: PublicSnapshot
  setup: EventSetup
  /** 'live' cards show the match; 'seats' (the encounters step's mini plan) show plate + idle drawing only. */
  variant: 'live' | 'seats'
  selected?: TableNumber | null
  onPickTable?: (table: TableNumber) => void
  /** Present → each block's handle is a button choosing its encounter (aria-haspopup="dialog"). */
  onPickBlock?: (first: TableNumber, trigger: HTMLElement) => void
  /** The block drawn as the drop target of an encounter being dragged (3px ink ring). */
  highlightBlock?: TableNumber | null
}

const scoreOf = (match: MatchView, side: Side): number =>
  match.state.current?.[side] ?? 0

type LiveCardProps = {
  event: PublicSnapshot
  hallTable: HallTable
  /** It stands along the top of a block whose band names it: its content starts below the band. */
  isBanded: boolean
  isSelected: boolean
  onPick: ((table: TableNumber) => void) | undefined
  plan: HallPlan
  state: LiveTableState
}

/** One table where it stands: its plate, then the match on it or the one it waits for. */
const LiveCard: React.FC<LiveCardProps> = ({
  event,
  hallTable,
  isBanded,
  isSelected,
  onPick,
  plan,
  state
}) => {
  const translate = useTranslate()
  const { table } = hallTable
  const callOf = (match: MatchView): string =>
    isDoublesLabel(match.label)
      ? translate('display.wall.doubles')
      : (wallCallOf(match) ?? '')
  const familyOf = (match: MatchView, side: Side): string =>
    sideName({
      form: 'family',
      participant: match[side],
      players: event.players
    }) ?? translate('match.unnamedSide')
  const label =
    state.kind === 'live'
      ? [
          translate('organiser.live.tableLive', {
            away: familyOf(state.match, 'away'),
            awayScore: scoreOf(state.match, 'away'),
            call: callOf(state.match),
            home: familyOf(state.match, 'home'),
            homeScore: scoreOf(state.match, 'home'),
            table
          }),
          state.pill === null
            ? null
            : translate(`organiser.live.pill.${state.pill}`)
        ]
          .filter((part) => part !== null)
          .join('. ')
      : state.kind === 'next'
        ? translate('organiser.live.tableNext', {
            call: callOf(state.match),
            table
          })
        : translate('organiser.live.tableFree', { table })

  const body = (
    <>
      <span className='plan-plate'>{table}</span>
      {state.kind === 'next' ? (
        <span className='live-call' data-next>
          {translate('organiser.live.next', { call: callOf(state.match) })}
        </span>
      ) : null}
      {state.kind === 'live' ? (
        <>
          <span className='live-call'>{callOf(state.match)}</span>
          {state.pill === null ? null : (
            <span className='live-card-pill'>
              <LivePill pill={state.pill} />
            </span>
          )}
        </>
      ) : null}
      <span className='plan-table-top'>
        <TableTop
          isIdle={state.kind !== 'live'}
          isTurned={hallTable.isTurned}
        />
        {state.kind === 'live'
          ? sides.map((side) => (
              <b
                className='live-score'
                data-dimmed={state.dimmed === side || undefined}
                data-side={side}
                key={side}
              >
                {scoreOf(state.match, side)}
              </b>
            ))
          : null}
      </span>
      {state.kind === 'live' ? (
        <span className='live-names'>
          {sides.map((side) => {
            const paint = sidePaintOf({
              match: state.match,
              side,
              snapshot: event
            })

            return (
              <span
                className='live-name'
                data-white={paint.isWhite || undefined}
                key={side}
                style={{ '--team': paint.colour }}
              >
                {familyOf(state.match, side)}
              </span>
            )
          })}
        </span>
      ) : null}
    </>
  )

  return (
    <div
      className='plan-table live-card'
      data-banded={isBanded || undefined}
      data-plan-table={table}
      data-selected={isSelected || undefined}
      data-turned={hallTable.isTurned || undefined}
      style={placedOn(areaOf(hallTable), plan)}
    >
      {onPick === undefined ? (
        <span className='plan-table-open'>{body}</span>
      ) : (
        <button
          aria-label={label}
          aria-pressed={isSelected}
          className='plan-table-open'
          onClick={() => onPick(table)}
          type='button'
        >
          {body}
        </button>
      )}
    </div>
  )
}

/**
 * The hall to scale as the organiser set it up, read only: each standing
 * table with the match on it, or the one it waits for, and each block of two
 * touching tables under its home team's colour. Its handle can choose the
 * block's encounter; a table can be picked.
 */
export const LiveFloor: React.FC<LiveFloorProps> = ({
  event,
  highlightBlock = null,
  onPickBlock,
  onPickTable,
  selected = null,
  setup,
  variant
}) => {
  const translate = useTranslate()
  const plan = hallPlanOf(setup)
  const hasBlocks = (setup.tournament ?? null) === null
  const pairs = hasBlocks ? standingPairsOf(plan) : []
  const blocks = blockLabelsOf({ event, tableCount: setup.tableCount })
  const banded = pairs.filter(
    (pair) =>
      pair.isAdjacent &&
      (variant === 'seats' ||
        onPickBlock !== undefined ||
        pair.area.width >= pair.area.height)
  )
  const bandedTables = new Set(
    banded.flatMap((pair) => tablesAlongTopOf(pair, plan))
  )

  return (
    <div
      className='plan live-floor'
      data-picks-blocks={onPickBlock !== undefined || undefined}
      data-picks-tables={onPickTable !== undefined || undefined}
      data-variant={variant}
    >
      <section
        aria-label={translate('organiser.hall.label')}
        className='plan-floor'
        style={floorStyleOf(plan)}
      >
        <PlanLinks pairs={pairs} plan={plan} />
        {standingTablesOf(plan).map((hallTable) => (
          <LiveCard
            event={event}
            hallTable={hallTable}
            isBanded={bandedTables.has(hallTable.table)}
            isSelected={selected === hallTable.table}
            key={hallTable.table}
            onPick={onPickTable}
            plan={plan}
            state={
              variant === 'live'
                ? liveTableStateOf(event, hallTable.table)
                : { kind: 'free' }
            }
          />
        ))}
        {pairs
          .filter((pair) => pair.isAdjacent)
          .map((pair) => {
            const [first] = pair.tables
            const block = blocks.get(first)
            const encounter = block?.encounter ?? null
            const colour = block?.colour ?? null
            const isBanded = banded.includes(pair)
            const handle = (
              <>
                <b>{blockNameOf(first)}</b>
                {encounter === null && onPickBlock === undefined ? null : (
                  <span>
                    {encounter ?? translate('organiser.plan.noEncounter')}
                  </span>
                )}
                {onPickBlock === undefined ? null : (
                  <Icon className='plan-handle-caret' name='chevronDown' />
                )}
              </>
            )

            return (
              <div
                className='plan-pair'
                data-banded={isBanded || undefined}
                data-encounter={colour !== null || undefined}
                data-highlight={highlightBlock === first || undefined}
                data-plan-block={first}
                key={first}
                style={{
                  ...placedOn(pair.area, plan),
                  '--block': colour?.background,
                  '--on-block': colour?.text
                }}
              >
                {!isBanded ? null : onPickBlock === undefined ? (
                  <span className='plan-handle'>{handle}</span>
                ) : (
                  <button
                    aria-haspopup='dialog'
                    aria-label={translate('organiser.live.blockLabel', {
                      block: blockNameOf(first),
                      encounter:
                        encounter ?? translate('organiser.plan.noEncounter')
                    })}
                    className='plan-handle'
                    onClick={(click) => onPickBlock(first, click.currentTarget)}
                    type='button'
                  >
                    {handle}
                  </button>
                )}
              </div>
            )
          })}
      </section>
      <p className='plan-stands'>{translate('organiser.hall.stands')}</p>
    </div>
  )
}
