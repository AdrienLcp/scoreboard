import type React from 'react'
import { useRef, useState } from 'react'
import { DisclosureGroup } from 'react-aria-components'
import { createPortal } from 'react-dom'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type { PublicSnapshot } from '@scoreboard/protocol/event-snapshot'
import type {
  EncounterId,
  EventId,
  MatchId,
  TableNumber
} from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'
import type { Side } from '@scoreboard/protocol/side'

import {
  blockOf,
  hallPlanOf,
  standingTablesOf
} from '@scoreboard/core/hall/hall-plan'

import { FederationSource } from '@/features/club/federation-source'
import { useClub } from '@/features/club/use-club'
import { useCurrentFederationPools } from '@/features/club/use-federation-pools'
import { encounterLinesFor } from '@/features/event/encounter-lines'
import { nowMs } from '@/infrastructure/clock'
import { toLocalDay } from '@/infrastructure/dates'
import { Button } from '@/presentation/components/button'
import {
  Disclosure,
  DisclosurePanel
} from '@/presentation/components/disclosure'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import {
  BlockChooser,
  type ChoosableEncounter,
  EncounterTeams
} from './block-chooser'
import { ClubEncounterForm } from './club-encounter-form'
import { EncounterForm } from './encounter-form'
import { encounterLineupOf, seatedCountOf } from './encounter-lineups'
import { EncounterRow } from './encounter-row'
import { LiveFloor } from './live-floor'
import { RoundEncounters } from './round-encounters'
import { dayRoundOf } from './round-of-day'
import { clearBlock, seatEncounterOnBlock } from './setup-edits'
import { type StandingBlock, TablesChooser } from './tables-chooser'
import { teamColourOf } from './team-chip'
import { useEncounterDrag } from './use-encounter-drag'

type ChampionshipEncountersProps = {
  event: PublicSnapshot
  eventId: EventId
  onChangeFormat: () => void
  onNext: () => void
  onRecord: (matchId: MatchId, event: ScoringEvent) => void
  onSave: (setup: EventSetup) => boolean
  setup: EventSetup
}

/** The last change, said in words, with a way back. */
type Notice = { previous: EventSetup; text: string }

type Choosing =
  | { first: TableNumber; kind: 'block'; trigger: HTMLElement }
  | { encounterId: EncounterId; kind: 'tables'; trigger: HTMLElement }

const SIDES: readonly Side[] = ['home', 'away']

const blockName = (first: TableNumber) => `${first}–${first + 1}`

const encounterName = (encounter: ChoosableEncounter) =>
  `${encounter.homeName} – ${encounter.awayName}`

/** The blocks of the hall with at least one table standing today, in order. */
const standingBlocksOf = (setup: EventSetup): StandingBlock[] => {
  const standing = standingTablesOf(hallPlanOf(setup))
    .map((table) => table.table)
    .filter((table) => table <= setup.tableCount)
  const firsts = [...new Set(standing.map((table) => blockOf(table)[0]))]

  return firsts
    .toSorted((one, other) => one - other)
    .map((first) => ({
      first,
      standing: blockOf(first).filter((table) => standing.includes(table))
        .length,
      tables: blockOf(first).filter((table) => table <= setup.tableCount)
    }))
}

/**
 * The championship's match day: each encounter of the round on a line, its
 * tables picked by block or by dragging it onto the plan beside, its
 * compositions opened in place; the round's encounters to add below. Every
 * change says what it did and is undone in one tap.
 */
export const ChampionshipEncounters: React.FC<ChampionshipEncountersProps> = ({
  event,
  eventId,
  onChangeFormat,
  onNext,
  onRecord,
  onSave,
  setup
}) => {
  const translate = useTranslate()
  const { state } = useClub()
  const [notice, setNotice] = useState<Notice | null>(null)
  const [choosing, setChoosing] = useState<Choosing | null>(null)
  const [preview, setPreview] = useState<TableNumber | null>(null)
  const floorArea = useRef<HTMLDivElement>(null)
  const federationPools = useCurrentFederationPools(
    state.status === 'ready' ? state.record : null
  )
  const round =
    state.status === 'ready'
      ? dayRoundOf({
          day: toLocalDay(setup.startsAtMs ?? nowMs()),
          eventId,
          federationPools,
          record: state.record,
          setup
        })
      : null
  const choosable: ChoosableEncounter[] = encounterLinesFor(event).map(
    (line) => {
      const encounter = event.encounters.find(
        (candidate) => candidate.id === line.id
      )

      return {
        awayName: line.awayName,
        colours:
          encounter === undefined
            ? null
            : {
                away: teamColourOf(event, encounter.away),
                home: teamColourOf(event, encounter.home)
              },
        homeName: line.homeName,
        id: line.id,
        tables: line.tables
      }
    }
  )
  const [initiallyOpen] = useState(() => {
    const firstIncomplete = setup.encounters.find((encounter) =>
      SIDES.some((side) => {
        const lineup = encounterLineupOf({ encounter, setup, side })

        return seatedCountOf(lineup) < lineup.length
      })
    )

    return firstIncomplete === undefined ? [] : [firstIncomplete.id]
  })

  const save = (next: EventSetup, text: string) => {
    if (onSave(next)) {
      setNotice({ previous: setup, text })
    }
  }

  const seat = (encounterId: EncounterId, first: TableNumber) => {
    setChoosing(null)
    setPreview(null)
    const block = blockOf(first).filter((table) => table <= setup.tableCount)
    const moved = choosable.find((encounter) => encounter.id === encounterId)
    const other = choosable.find(
      (encounter) =>
        encounter.id !== encounterId &&
        encounter.tables.some((table) => block.includes(table))
    )

    if (
      moved === undefined ||
      (moved.tables.length > 0 &&
        moved.tables.every((table) => block.includes(table)))
    ) {
      return
    }

    save(
      seatEncounterOnBlock({ block, encounterId, setup }),
      other === undefined
        ? translate('organiser.plan.blockSeated', {
            block: blockName(first),
            encounter: encounterName(moved)
          })
        : translate('organiser.encountersStep.swapped', {
            one: encounterName(moved),
            other: encounterName(other)
          })
    )
  }

  const free = (first: TableNumber) => {
    setChoosing(null)
    const block = blockOf(first).filter((table) => table <= setup.tableCount)

    if (
      !choosable.some((encounter) =>
        encounter.tables.some((table) => block.includes(table))
      )
    ) {
      return
    }

    save(
      clearBlock(setup, block),
      translate('organiser.plan.blockCleared', { block: blockName(first) })
    )
  }

  const saveAdded = (next: EventSetup) =>
    save(
      next,
      translate('organiser.encountersStep.added', {
        count: Math.max(1, next.encounters.length - setup.encounters.length)
      })
    )

  const { drag, gripProps } = useEncounterDrag({
    area: floorArea,
    onDrop: seat
  })
  const dragged = choosable.find(
    (encounter) => encounter.id === drag?.encounterId
  )
  const chosenEncounter =
    choosing?.kind === 'tables'
      ? choosable.find((encounter) => encounter.id === choosing.encounterId)
      : undefined
  const count = setup.encounters.length

  return (
    <div className='encounters-step'>
      <section
        aria-labelledby='encounters-step-title'
        className='encounters-step-main'
      >
        <div className='encounters-step-head'>
          <h2 id='encounters-step-title'>
            {count === 0
              ? translate('organiser.steps.format.championship')
              : round?.number == null
                ? translate('organiser.encountersStep.title', { count })
                : translate('organiser.encountersStep.roundTitle', {
                    count,
                    number: round.number
                  })}
          </h2>
          <Button onPress={onChangeFormat} variant='quiet'>
            {translate('organiser.encountersStep.changeFormat')}
          </Button>
        </div>
        {notice === null ? null : (
          <div className='encounters-step-notice'>
            <p aria-live='polite'>{notice.text}</p>
            <Button
              onPress={() => {
                if (onSave(notice.previous)) {
                  setNotice(null)
                }
              }}
              variant='quiet'
            >
              <Icon name='undo' />
              {translate('organiser.hall.cancel')}
            </Button>
          </div>
        )}
        {count === 0 ? (
          <p className='organiser-empty'>
            {translate('organiser.encountersStep.empty')}
          </p>
        ) : (
          <DisclosureGroup
            className='encounters-step-list'
            defaultExpandedKeys={initiallyOpen}
          >
            {setup.encounters.map((encounter) => {
              const line = choosable.find(
                (candidate) => candidate.id === encounter.id
              )

              return line === undefined ? null : (
                <EncounterRow
                  choosable={line}
                  encounter={encounter}
                  event={event}
                  gripProps={gripProps(encounter.id)}
                  isLifted={drag?.encounterId === encounter.id}
                  key={encounter.id}
                  onChooseTables={(trigger) =>
                    setChoosing({
                      encounterId: encounter.id,
                      kind: 'tables',
                      trigger
                    })
                  }
                  onRecord={onRecord}
                  onSave={save}
                  setup={setup}
                />
              )
            })}
          </DisclosureGroup>
        )}
        {round === null || round.away.length === 0 ? null : (
          <p className='encounters-step-away'>
            <Icon name='away' />
            {translate('organiser.encountersStep.away', {
              encounters: round.away.map((away) =>
                translate('organiser.encountersStep.awayAt', away)
              )
            })}
          </p>
        )}
        {round?.isFromFederation === true && !round.hasHomeToAdd ? (
          <FederationSource />
        ) : null}
        <div className='encounters-step-add'>
          {round?.hasHomeToAdd === true ? (
            <RoundEncounters
              eventId={eventId}
              federationPools={federationPools}
              onSave={saveAdded}
              setup={setup}
            />
          ) : null}
          <Disclosure
            className='encounters-step-more'
            defaultExpanded={count === 0}
          >
            <Button
              className='encounters-step-more-trigger'
              slot='trigger'
              variant='quiet'
            >
              <Icon name='plus' />
              {translate('organiser.encountersStep.addAnother')}
              <Icon name='chevronDown' />
            </Button>
            <DisclosurePanel>
              <div className='encounters-step-forms'>
                <ClubEncounterForm onSave={saveAdded} setup={setup} />
                <EncounterForm onSave={saveAdded} setup={setup} />
              </div>
            </DisclosurePanel>
          </Disclosure>
        </div>
      </section>
      <aside className='encounters-step-side'>
        <section
          aria-labelledby='encounters-step-hall'
          className='encounters-step-hall'
        >
          <h2 id='encounters-step-hall'>
            {translate('organiser.encountersStep.hall')}
          </h2>
          <div ref={floorArea}>
            <LiveFloor
              event={event}
              highlightBlock={drag === null ? preview : drag.over}
              onPickBlock={(first, trigger) =>
                setChoosing({ first, kind: 'block', trigger })
              }
              setup={setup}
              variant='seats'
            />
          </div>
          <p className='encounters-step-hint'>
            {translate('organiser.encountersStep.hallHint')}
          </p>
        </section>
        <Button
          className='encounters-step-next'
          onPress={onNext}
          variant='primary'
        >
          {translate('organiser.steps.next.live')}
          <Icon name='arrowRight' />
        </Button>
      </aside>
      {choosing?.kind === 'block' ? (
        <BlockChooser
          encounters={choosable}
          first={choosing.first}
          onChoose={(encounterId) =>
            encounterId === null
              ? free(choosing.first)
              : seat(encounterId, choosing.first)
          }
          onClose={() => setChoosing(null)}
          trigger={choosing.trigger}
        />
      ) : null}
      {chosenEncounter === undefined || choosing?.kind !== 'tables' ? null : (
        <TablesChooser
          blocks={standingBlocksOf(setup)}
          encounter={chosenEncounter}
          encounters={choosable}
          onChoose={(first) => seat(chosenEncounter.id, first)}
          onClose={() => setChoosing(null)}
          onPreview={setPreview}
          trigger={choosing.trigger}
        />
      )}
      {drag === null || dragged === undefined
        ? null
        : createPortal(
            <div
              className='encounter-drag-ghost'
              style={{ left: `${drag.x}px`, top: `${drag.y}px` }}
            >
              <EncounterTeams encounter={dragged} />
            </div>,
            document.body
          )}
    </div>
  )
}
