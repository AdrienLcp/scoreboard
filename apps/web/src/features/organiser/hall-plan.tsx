import type React from 'react'
import { useEffect, useRef, useState } from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type {
  PublicSnapshot,
  TableAccess
} from '@scoreboard/protocol/event-snapshot'
import type { HallPlan } from '@scoreboard/protocol/hall-plan'
import type {
  EncounterId,
  EventId,
  MatchId,
  TableNumber
} from '@scoreboard/protocol/identifiers'
import type { MatchStatus } from '@scoreboard/protocol/match-state'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'

import {
  DEFAULT_OPPONENT_COLOUR,
  textColourOn
} from '@scoreboard/core/club/team-colours'
import {
  blockOf,
  freeSpotOf,
  hallPlanOf,
  isInTouchingBlock,
  moveHallTables,
  putBackHallTable,
  swapHallBlocks,
  swapHallTables,
  turnHallTable
} from '@scoreboard/core/hall/hall-plan'
import {
  freeTablesFor,
  type MatchStatusOf,
  matchesRunningOn,
  type PutAwayDestination,
  putAwayTables,
  resumeWaitingMatchOn
} from '@scoreboard/core/hall/table-put-away'

import {
  type EncounterLine,
  encounterLinesFor
} from '@/features/event/encounter-lines'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { AwaySheet } from './away-sheet'
import { BlockChooser, type ChoosableEncounter } from './block-chooser'
import { HallTableSheet } from './hall-table-sheet'
import { blockLabelsOf, blockNameOf } from './plan-blocks'
import { PlanFloor } from './plan-floor'
import { SavedPlans } from './saved-plans'
import {
  addTable,
  changeHall,
  changeTableCount,
  clearBlock,
  deleteTable,
  seatEncounterOnBlock
} from './setup-edits'
import type { DropTarget } from './use-plan-drag'

import './hall-plan.sass'

type HallPlanBoardProps = {
  accesses: readonly TableAccess[]
  /** The side column's own panels, under the opened table's sheet. */
  aside?: React.ReactNode
  event: PublicSnapshot
  eventId: EventId
  onRecord: (matchId: MatchId, event: ScoringEvent) => void
  onSave: (setup: EventSetup) => boolean
  setup: EventSetup
}

/** The last change, said in words, with a way back. */
type Notice = { previous: EventSetup | null; text: string }

/**
 * Tables about to be put away while matches run on them: where each match
 * goes on, asked one match at a time, before anything changes.
 */
type PutAwayRequest = {
  destinations: ReadonlyMap<MatchId, PutAwayDestination>
  tables: readonly TableNumber[]
}

const statusOfIn = (event: PublicSnapshot): MatchStatusOf => {
  const statuses = new Map<MatchId, MatchStatus>(
    event.matches.map((match) => [match.id, match.state.status])
  )

  return (matchId) => statuses.get(matchId) ?? 'scheduled'
}

const colourOf = (event: PublicSnapshot, teamId: string) => {
  const colour =
    event.teams.find((team) => team.id === teamId)?.colour ??
    DEFAULT_OPPONENT_COLOUR

  return { background: colour, text: textColourOn(colour) }
}

/** The tables a match is being played on right now. */
const playingTables = (event: PublicSnapshot): Set<TableNumber> =>
  new Set(
    event.matches.flatMap((match) =>
      match.table !== null &&
      match.timing.startedAtMs !== null &&
      match.timing.finishedAtMs === null
        ? [match.table]
        : []
    )
  )

/**
 * The hall seen from above, to set up as it stands today: drag a table or a
 * block where it goes, turn it, put it away for the day, add one; tap a
 * table for its umpire QR and what to change, a block's handle for its
 * encounter. Every change says what it did and is undone in one tap.
 */
export const HallPlanBoard: React.FC<HallPlanBoardProps> = ({
  accesses,
  aside,
  event,
  eventId,
  onRecord,
  onSave,
  setup
}) => {
  const translate = useTranslate()
  const [selected, setSelected] = useState<TableNumber | null>(null)
  const [choosing, setChoosing] = useState<{
    first: TableNumber
    trigger: HTMLElement
  } | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [putAwayRequest, setPutAwayRequest] = useState<PutAwayRequest | null>(
    null
  )
  const sheet = useRef<HTMLDivElement>(null)
  const plan = hallPlanOf(setup)
  const nextSpot = freeSpotOf(plan)
  const drawn: HallPlan = { ...plan, depth: nextSpot.depth }
  const lines = encounterLinesFor(event)
  const hasBlocks = (setup.tournament ?? null) === null
  const selectedTable =
    selected !== null && selected <= setup.tableCount ? selected : null
  const statusOf = statusOfIn(event)
  const runningOn = (tables: readonly TableNumber[]) =>
    matchesRunningOn({ matches: setup.matches, statusOf, tables })
  const asked =
    putAwayRequest === null
      ? undefined
      : runningOn(putAwayRequest.tables).find(
          (running) => !putAwayRequest.destinations.has(running.id)
        )
  const askedView =
    asked === undefined
      ? undefined
      : event.matches.find((match) => match.id === asked.id)

  const revealSheet = () =>
    requestAnimationFrame(() =>
      sheet.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    )

  const save = (next: EventSetup, text: string) => {
    if (onSave(next)) {
      setNotice({ previous: setup, text })
    }
  }

  const saveHall = (next: HallPlan | null, text: string, refusal: string) => {
    if (next === null) {
      setNotice({ previous: null, text: refusal })

      return
    }

    save(changeHall(setup, next), text)
  }

  const encounterOf = (first: TableNumber): EncounterLine | undefined =>
    lines.find((line) =>
      line.tables.some((table) => blockOf(first).includes(table))
    )

  const blocks = blockLabelsOf({ event, tableCount: setup.tableCount })

  const choosable: ChoosableEncounter[] = lines.map((line) => {
    const encounter = event.encounters.find(
      (candidate) => candidate.id === line.id
    )

    return {
      awayName: line.awayName,
      colours:
        encounter === undefined
          ? null
          : {
              away: colourOf(event, encounter.away).background,
              home: colourOf(event, encounter.home).background
            },
      homeName: line.homeName,
      id: line.id,
      tables: line.tables
    }
  })

  const turn = (table: TableNumber) => {
    const isBlock = isInTouchingBlock(plan, table)
    const first = blockOf(table)[0]

    saveHall(
      turnHallTable(plan, table),
      isBlock
        ? translate('organiser.plan.turnedBlock', { block: blockNameOf(first) })
        : translate('organiser.plan.turnedTable', { table }),
      isBlock
        ? translate('organiser.plan.noRoomToTurnBlock', {
            block: blockNameOf(first)
          })
        : translate('organiser.plan.noRoomToTurn', { table })
    )
  }

  const finishPutAway = (
    tables: readonly TableNumber[],
    destinations: ReadonlyMap<MatchId, PutAwayDestination>
  ) => {
    setPutAwayRequest(null)

    const moves = runningOn(tables).flatMap((running) => {
      const destination = destinations.get(running.id)

      if (destination === undefined) {
        return []
      }

      return destination === 'waiting'
        ? [
            translate('organiser.plan.away.movedWaiting', {
              from: running.table
            })
          ]
        : [
            translate('organiser.plan.away.movedOn', {
              from: running.table,
              to: destination
            })
          ]
    })
    const done =
      tables.length > 1
        ? translate('organiser.plan.putAwayBlock', {
            block: blockNameOf(tables[0] ?? 1)
          })
        : translate('organiser.plan.putAwayDone', { table: tables[0] ?? 1 })

    save(
      putAwayTables({ destinations, setup, statusOf, tables }),
      [done, ...moves].join(' ')
    )
  }

  const putAway = (tables: readonly TableNumber[]) => {
    if (selectedTable !== null && tables.includes(selectedTable)) {
      setSelected(null)
    }

    if (runningOn(tables).length > 0) {
      setPutAwayRequest({ destinations: new Map(), tables })
      revealSheet()

      return
    }

    finishPutAway(tables, new Map())
  }

  const chooseDestination = (destination: PutAwayDestination) => {
    if (putAwayRequest === null || asked === undefined) {
      return
    }

    const destinations = new Map(putAwayRequest.destinations).set(
      asked.id,
      destination
    )
    const isEveryMatchPlaced = runningOn(putAwayRequest.tables).every(
      (running) => destinations.has(running.id)
    )

    if (isEveryMatchPlaced) {
      finishPutAway(putAwayRequest.tables, destinations)

      return
    }

    setPutAwayRequest({ ...putAwayRequest, destinations })
  }

  useEffect(() => {
    if (putAwayRequest !== null && asked === undefined) {
      finishPutAway(putAwayRequest.tables, putAwayRequest.destinations)
    }
  })

  const putBack = (table: TableNumber, at?: { x: number; y: number }) => {
    const hall = putBackHallTable({ at, plan, table })

    if (hall === null) {
      setNotice({
        previous: null,
        text: translate('organiser.plan.noRoomHere')
      })

      return
    }

    const placed = changeHall(setup, hall)
    const resumed = resumeWaitingMatchOn({ setup: placed, statusOf, table })

    save(
      resumed,
      resumed === placed
        ? translate('organiser.plan.putBackDone', { table })
        : translate('organiser.plan.putBackResumed', { table })
    )
  }

  const swap = (target: DropTarget, tables: readonly TableNumber[]) => {
    const [first] = tables

    if (first === undefined) {
      return
    }

    if (target.kind === 'table') {
      save(
        changeHall(setup, swapHallTables(plan, first, target.table)),
        translate('organiser.plan.swappedTables', {
          one: first,
          other: target.table
        })
      )

      return
    }

    save(
      changeHall(setup, swapHallBlocks(plan, first, target.first)),
      translate('organiser.plan.swappedBlocks', {
        one: blockNameOf(first),
        other: blockNameOf(target.first)
      })
    )
  }

  const chooseEncounter = (first: TableNumber, id: EncounterId | null) => {
    setChoosing(null)
    const block = blockOf(first).filter((table) => table <= setup.tableCount)

    if (id === null) {
      save(
        clearBlock(setup, block),
        translate('organiser.plan.blockCleared', { block: blockNameOf(first) })
      )

      return
    }

    const line = lines.find((candidate) => candidate.id === id)

    save(
      seatEncounterOnBlock({ block, encounterId: id, setup }),
      translate('organiser.plan.blockSeated', {
        block: blockNameOf(first),
        encounter:
          line === undefined ? '' : `${line.homeName} – ${line.awayName}`
      })
    )
  }

  const deleteSelected = (table: TableNumber) => {
    setSelected(null)
    save(
      deleteTable(setup, table),
      table === setup.tableCount
        ? translate('organiser.plan.deleted', { table })
        : translate('organiser.plan.deletedRenumbered', {
            count: setup.tableCount - 1,
            table
          })
    )
  }

  return (
    <div className='hall-layout'>
      <section className='hall-main'>
        <div className='hall-head'>
          <p aria-live='polite' className='hall-notice'>
            {notice?.text ?? translate('organiser.plan.hint')}
          </p>
          {notice?.previous === null || notice === null ? null : (
            <Button
              onPress={() => {
                if (notice.previous !== null && onSave(notice.previous)) {
                  setNotice(null)
                }
              }}
              variant='quiet'
            >
              <Icon name='undo' />
              {translate('organiser.hall.cancel')}
            </Button>
          )}
          <SavedPlans
            onUse={(saved, name) =>
              save(
                {
                  ...changeTableCount(setup, saved.tables.length),
                  hall: saved
                },
                translate('organiser.plan.used', { name })
              )
            }
            plan={plan}
          />
        </div>
        <PlanFloor
          blocks={blocks}
          gestures={{
            onMove: (tables, shiftX, shiftY) =>
              saveHall(
                moveHallTables({ plan, shiftX, shiftY, tables }),
                tables.length > 1
                  ? translate('organiser.plan.movedBlock', {
                      block: blockNameOf(tables[0] ?? 1)
                    })
                  : translate('organiser.plan.movedTable', {
                      table: tables[0] ?? 1
                    }),
                translate('organiser.plan.noRoomBack')
              ),
            onPickBlock: (first, trigger) => setChoosing({ first, trigger }),
            onPickTable: (table) => {
              setPutAwayRequest(null)
              setSelected((current) => (current === table ? null : table))
              revealSheet()
            },
            onPutAway: putAway,
            onPutBack: putBack,
            onSwap: swap
          }}
          hasBlocks={hasBlocks}
          nextSpot={nextSpot.area}
          onAdd={() => {
            save(
              addTable(setup),
              translate('organiser.plan.added', { table: setup.tableCount + 1 })
            )
            setSelected(setup.tableCount + 1)
          }}
          onPutAway={(table) => putAway([table])}
          onTurn={turn}
          plan={drawn}
          playing={playingTables(event)}
          selected={asked?.table ?? selectedTable}
        />
        {choosing === null ? null : (
          <BlockChooser
            encounters={choosable}
            first={choosing.first}
            onChoose={(id) => chooseEncounter(choosing.first, id)}
            onClose={() => setChoosing(null)}
            trigger={choosing.trigger}
          />
        )}
      </section>
      <div className='hall-side' ref={sheet}>
        {putAwayRequest === null ||
        asked === undefined ||
        askedView === undefined ? null : (
          <AwaySheet
            event={event}
            free={freeTablesFor({
              leaving: putAwayRequest.tables,
              setup,
              statusOf,
              taken: [...putAwayRequest.destinations.values()].filter(
                (destination) => destination !== 'waiting'
              )
            })}
            key={asked.id}
            match={{ ...askedView, table: asked.table }}
            onCancel={() => setPutAwayRequest(null)}
            onChoose={chooseDestination}
          />
        )}
        {putAwayRequest !== null || selectedTable === null ? null : (
          <HallTableSheet
            access={accesses.find((access) => access.table === selectedTable)}
            canDelete={setup.tableCount > 1}
            encounter={encounterOf(selectedTable)}
            event={event}
            eventId={eventId}
            hasBlocks={hasBlocks}
            onChooseEncounter={(trigger) =>
              setChoosing({ first: blockOf(selectedTable)[0], trigger })
            }
            onClose={() => setSelected(null)}
            onDelete={() => deleteSelected(selectedTable)}
            onPutAway={() => putAway([selectedTable])}
            onRecord={onRecord}
            onSaveSetup={(next) =>
              save(next, translate('organiser.plan.changed'))
            }
            onTurn={() => turn(selectedTable)}
            plan={plan}
            setup={setup}
            table={selectedTable}
          />
        )}
        {aside}
      </div>
    </div>
  )
}
