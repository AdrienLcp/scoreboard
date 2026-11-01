import type React from 'react'
import { useRef, useState } from 'react'
import { Button as AriaButton } from 'react-aria-components'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type {
  PublicSnapshot,
  TableAccess
} from '@scoreboard/protocol/event-snapshot'
import {
  HALL_GRID_SIZE,
  type HallPlan,
  type HallTable
} from '@scoreboard/protocol/hall-plan'
import type {
  EncounterId,
  EventId,
  TableNumber
} from '@scoreboard/protocol/identifiers'

import {
  DEFAULT_OPPONENT_COLOUR,
  textColourOn
} from '@scoreboard/core/club/team-colours'
import {
  blockOf,
  type HallPlace,
  hallPlanOf,
  placeHallTable
} from '@scoreboard/core/hall/hall-plan'

import {
  type EncounterLine,
  encounterLinesFor
} from '@/features/event/encounter-lines'
import { Button } from '@/presentation/components/button'
import { DrawnTable } from '@/presentation/components/drawn-table'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { HallTableSheet } from './hall-table-sheet'
import { changeHall, seatEncounterOnBlock } from './setup-edits'

import './hall-plan.sass'

/** A column without any table is an aisle: narrow, unless a table is being placed. */
const AISLE_TRACK = 'minmax(0.75rem, 0.3fr)'

/** What the next tap on the plan does. */
type Picking =
  | { kind: 'none' }
  | { kind: 'table'; table: TableNumber }
  | { kind: 'moving-table'; table: TableNumber }
  | { kind: 'moving-encounter'; encounterId: EncounterId }

type HallPlanBoardProps = {
  accesses: readonly TableAccess[]
  event: PublicSnapshot
  eventId: EventId
  onSave: (setup: EventSetup) => boolean
  setup: EventSetup
}

const teamColourOf = (event: PublicSnapshot, teamId: string): string =>
  event.teams.find((team) => team.id === teamId)?.colour ??
  DEFAULT_OPPONENT_COLOUR

/** The encounter seated on a table, if any. */
const encounterOn = (
  lines: readonly EncounterLine[],
  table: TableNumber
): EncounterLine | undefined =>
  lines.find((line) => line.tables.includes(table))

const extentOf = (
  tables: readonly HallTable[],
  axis: keyof HallPlace
): number => Math.max(0, ...tables.map((table) => table[axis])) + 1

/**
 * The hall seen from above with its tables where they stand: tap a table for
 * its umpire QR and what to change, tap an encounter then a table to seat it
 * on that table's block. Every change can be undone in one tap.
 */
export const HallPlanBoard: React.FC<HallPlanBoardProps> = ({
  accesses,
  event,
  eventId,
  onSave,
  setup
}) => {
  const translate = useTranslate()
  const [picking, setPicking] = useState<Picking>({ kind: 'none' })
  const [previous, setPrevious] = useState<EventSetup | null>(null)
  const sheet = useRef<HTMLDivElement>(null)
  const plan = hallPlanOf(setup)
  const lines = encounterLinesFor(event)
  const isPlacing = picking.kind === 'moving-table'
  const columns = Math.min(
    HALL_GRID_SIZE,
    extentOf(plan.tables, 'column') + (isPlacing ? 1 : 0)
  )
  const rows = Math.min(
    HALL_GRID_SIZE,
    extentOf(plan.tables, 'row') + (isPlacing ? 1 : 0)
  )
  const movingEncounter =
    picking.kind === 'moving-encounter'
      ? lines.find((line) => line.id === picking.encounterId)
      : undefined

  const save = (next: EventSetup) => {
    if (onSave(next)) {
      setPrevious(setup)
    }

    setPicking({ kind: 'none' })
  }

  const saveHall = (hall: HallPlan) => save(changeHall(setup, hall))

  const tableAt = (place: HallPlace): HallTable | undefined =>
    plan.tables.find(
      (table) => table.column === place.column && table.row === place.row
    )

  const pickTable = (table: TableNumber) => {
    if (picking.kind === 'moving-encounter') {
      save(
        seatEncounterOnBlock({
          block: blockOf(table).filter((number) => number <= setup.tableCount),
          encounterId: picking.encounterId,
          setup
        })
      )

      return
    }

    if (picking.kind === 'moving-table') {
      const target = plan.tables.find((candidate) => candidate.table === table)

      if (target !== undefined && table !== picking.table) {
        saveHall(placeHallTable({ place: target, plan, table: picking.table }))
      } else {
        setPicking({ kind: 'table', table })
      }

      return
    }

    setPicking(
      picking.kind === 'table' && picking.table === table
        ? { kind: 'none' }
        : { kind: 'table', table }
    )
    requestAnimationFrame(() =>
      sheet.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    )
  }

  const hint =
    picking.kind === 'moving-table'
      ? translate('organiser.hall.hintTable', { table: picking.table })
      : movingEncounter !== undefined
        ? translate('organiser.hall.hintEncounter', {
            encounter: `${movingEncounter.homeName} – ${movingEncounter.awayName}`
          })
        : translate('organiser.hall.hintIdle')

  const places = Array.from({ length: rows * columns }, (_, index) => ({
    column: index % columns,
    row: Math.floor(index / columns)
  }))
  const selectedTable = picking.kind === 'table' ? picking.table : null

  return (
    <div className='hall-layout'>
      <section className='hall-main'>
        <div className='hall-encounters'>
          <h2 className='organiser-subheading'>
            {translate('organiser.hall.encounters')}
          </h2>
          {lines.length === 0 ? (
            <p className='organiser-empty'>
              {translate('organiser.hall.noEncounter')}
            </p>
          ) : (
            <ul className='hall-encounter-list'>
              {lines.map((line) => {
                const encounter = event.encounters.find(
                  (candidate) => candidate.id === line.id
                )
                const isMoving = movingEncounter?.id === line.id

                return (
                  <li key={line.id}>
                    <AriaButton
                      aria-pressed={isMoving}
                      className='hall-encounter'
                      onPress={() =>
                        setPicking(
                          isMoving
                            ? { kind: 'none' }
                            : { encounterId: line.id, kind: 'moving-encounter' }
                        )
                      }
                    >
                      <span aria-hidden='true' className='hall-swatches'>
                        {[encounter?.home, encounter?.away].map(
                          (teamId, at) => (
                            <span
                              className='hall-swatch'
                              data-white={
                                teamId === undefined ||
                                teamColourOf(event, teamId).toUpperCase() ===
                                  DEFAULT_OPPONENT_COLOUR ||
                                undefined
                              }
                              key={at === 0 ? 'home' : 'away'}
                              style={{
                                '--team':
                                  teamId === undefined
                                    ? DEFAULT_OPPONENT_COLOUR
                                    : teamColourOf(event, teamId)
                              }}
                            />
                          )
                        )}
                      </span>
                      <span className='hall-encounter-names'>
                        {line.homeName} – {line.awayName}
                      </span>
                      <span className='hall-encounter-tables'>
                        {line.tables.length === 0
                          ? translate('organiser.hall.noTable')
                          : line.tables.join('–')}
                      </span>
                    </AriaButton>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <div className='hall-hint'>
          <p aria-live='polite'>{hint}</p>
          {picking.kind === 'moving-table' ||
          picking.kind === 'moving-encounter' ? (
            <Button
              onPress={() => setPicking({ kind: 'none' })}
              variant='quiet'
            >
              <Icon name='close' />
              {translate('organiser.hall.cancel')}
            </Button>
          ) : previous === null ? null : (
            <Button
              onPress={() => {
                if (onSave(previous)) {
                  setPrevious(null)
                }
              }}
              variant='quiet'
            >
              <Icon name='undo' />
              {translate('organiser.hall.undo')}
            </Button>
          )}
        </div>
        <section
          aria-label={translate('organiser.hall.label')}
          className='hall-floor'
          data-picking={picking.kind}
          style={{
            '--plan-columns': Array.from({ length: columns }, (_, column) =>
              isPlacing || plan.tables.some((table) => table.column === column)
                ? 'minmax(0, 1fr)'
                : AISLE_TRACK
            ).join(' ')
          }}
        >
          {places.map((place) => {
            const hallTable = tableAt(place)

            if (hallTable === undefined) {
              return picking.kind === 'moving-table' ? (
                <AriaButton
                  aria-label={translate('organiser.hall.emptyPlace')}
                  className='hall-place'
                  key={`${place.column}-${place.row}`}
                  onPress={() =>
                    saveHall(
                      placeHallTable({ place, plan, table: picking.table })
                    )
                  }
                >
                  <Icon name='plus' />
                </AriaButton>
              ) : (
                <span
                  aria-hidden='true'
                  className='hall-aisle'
                  key={`${place.column}-${place.row}`}
                />
              )
            }

            const { table } = hallTable
            const line = encounterOn(lines, table)
            const encounter = event.encounters.find(
              (candidate) => candidate.id === line?.id
            )
            const isBeingMoved =
              (picking.kind === 'moving-table' && picking.table === table) ||
              movingEncounter?.tables.includes(table) === true

            return (
              <AriaButton
                aria-pressed={selectedTable === table}
                className='hall-table'
                data-hidden={hallTable.isHidden || undefined}
                data-moving={isBeingMoved || undefined}
                key={table}
                onPress={() => pickTable(table)}
              >
                <span className='hall-table-head'>
                  <span className='hall-plate'>
                    {translate('organiser.access.table', { table })}
                  </span>
                  {hallTable.isHidden ? (
                    <span className='hall-table-state'>
                      {translate('organiser.hall.hidden')}
                    </span>
                  ) : null}
                </span>
                <DrawnTable
                  className='hall-drawing'
                  isIdle={line === undefined || hallTable.isHidden}
                />
                {encounter === undefined || line === undefined ? (
                  <span className='hall-table-free'>
                    {hallTable.isHidden
                      ? null
                      : translate('organiser.hall.free')}
                  </span>
                ) : (
                  <span className='hall-table-teams'>
                    {[encounter.home, encounter.away].map((teamId, at) => {
                      const colour = teamColourOf(event, teamId)

                      return (
                        <span
                          className='hall-team'
                          data-white={
                            colour.toUpperCase() === DEFAULT_OPPONENT_COLOUR ||
                            undefined
                          }
                          key={at === 0 ? 'home' : 'away'}
                          style={{
                            '--on-team': textColourOn(colour),
                            '--team': colour
                          }}
                        >
                          {at === 0 ? line.homeName : line.awayName}
                        </span>
                      )
                    })}
                  </span>
                )}
              </AriaButton>
            )
          })}
          <p className='hall-stands'>{translate('organiser.hall.stands')}</p>
        </section>
      </section>
      <div className='hall-side' ref={sheet}>
        {selectedTable === null ? null : (
          <HallTableSheet
            access={accesses.find((access) => access.table === selectedTable)}
            encounter={encounterOn(lines, selectedTable)}
            eventId={eventId}
            onClose={() => setPicking({ kind: 'none' })}
            onMoveEncounter={(encounterId) =>
              setPicking({ encounterId, kind: 'moving-encounter' })
            }
            onMoveTable={() =>
              setPicking({ kind: 'moving-table', table: selectedTable })
            }
            onSaveHall={(hall, table) => {
              if (onSave(changeHall(setup, hall))) {
                setPrevious(setup)
              }

              setPicking({ kind: 'table', table })
            }}
            plan={plan}
            table={selectedTable}
            tableCount={setup.tableCount}
          />
        )}
      </div>
    </div>
  )
}
