import type React from 'react'
import { useRef } from 'react'

import type { Encounter, EventSetup } from '@scoreboard/protocol/event-setup'
import type { PublicSnapshot } from '@scoreboard/protocol/event-snapshot'
import type { MatchId } from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'
import type { Side } from '@scoreboard/protocol/side'

import { useClubTranslate } from '@/features/club/use-club-translate'
import { PlainButton } from '@/presentation/components/button'
import {
  Disclosure,
  DisclosurePanel
} from '@/presentation/components/disclosure'
import { Icon } from '@/presentation/components/icon'

import { type ChoosableEncounter, useTablesLabel } from './block-chooser'
import { EncounterDetail } from './encounter-detail'
import {
  encounterLineupOf,
  seatedCountOf,
  sideLettersOf
} from './encounter-lineups'
import { TeamChip, teamColourOf } from './team-chip'

import './encounter-row.sass'

type EncounterRowProps = {
  choosable: ChoosableEncounter
  encounter: Encounter
  event: PublicSnapshot
  /** Pointer handlers that carry the row by its grip onto the plan. */
  gripProps: React.HTMLAttributes<HTMLElement>
  isLifted: boolean
  onChooseTables: (trigger: HTMLElement) => void
  onRecord: (matchId: MatchId, event: ScoringEvent) => void
  onSave: (setup: EventSetup, text: string) => void
  setup: EventSetup
}

const SIDES: readonly Side[] = ['home', 'away']

/**
 * An encounter of the day on one line: a grip to drag it onto the plan, its
 * tables as a button that moves it, both teams and how far each composition
 * is; opened, the composition itself.
 */
export const EncounterRow: React.FC<EncounterRowProps> = ({
  choosable,
  encounter,
  event,
  gripProps,
  isLifted,
  onChooseTables,
  onRecord,
  onSave,
  setup
}) => {
  const translate = useClubTranslate()
  const tablesLabel = useTablesLabel()
  const tablesButton = useRef<HTMLButtonElement>(null)
  const name = `${choosable.homeName} – ${choosable.awayName}`
  const isSeated = choosable.tables.length > 0

  return (
    <Disclosure
      className={isLifted ? 'encounter-row is-lifted' : 'encounter-row'}
      id={encounter.id}
    >
      <div className='encounter-row-head'>
        <span
          aria-hidden='true'
          className='encounter-row-grip'
          title={translate('organiser.encountersStep.grip')}
          {...gripProps}
        >
          <Icon name='grip' />
        </span>
        <PlainButton
          aria-haspopup='dialog'
          aria-label={translate('organiser.encountersStep.tablesOf', {
            encounter: name,
            tables: isSeated
              ? tablesLabel(choosable.tables)
              : translate('organiser.encountersStep.toChoose')
          })}
          className='encounter-row-tables'
          data-unset={!isSeated || undefined}
          onPress={() => {
            if (tablesButton.current !== null) {
              onChooseTables(tablesButton.current)
            }
          }}
          ref={tablesButton}
        >
          <span>
            {isSeated
              ? tablesLabel(choosable.tables)
              : translate('organiser.encountersStep.chooseTables')}
          </span>
          <Icon name='chevronDown' />
        </PlainButton>
        <PlainButton className='encounter-row-summary' slot='trigger'>
          <span className='encounter-row-teams'>
            <TeamChip
              colour={teamColourOf(event, encounter.home)}
              name={choosable.homeName}
            />
            <span className='encounter-row-receives'>
              {translate('organiser.encountersStep.receives')}
            </span>
            <TeamChip
              colour={teamColourOf(event, encounter.away)}
              name={choosable.awayName}
            />
          </span>
          <span className='encounter-row-counts'>
            {SIDES.map((side) => {
              const seated = seatedCountOf(
                encounterLineupOf({ encounter, setup, side })
              )
              const total = sideLettersOf(encounter, side).length
              const isComplete = seated >= total

              return (
                <span
                  className='encounter-row-count'
                  data-complete={isComplete || undefined}
                  key={side}
                >
                  {isComplete ? <Icon name='check' /> : null}
                  {side === 'home' ? choosable.homeName : choosable.awayName}
                  {isComplete ? null : (
                    <b>
                      {translate('organiser.encountersStep.seated', {
                        seated,
                        total
                      })}
                    </b>
                  )}
                </span>
              )
            })}
          </span>
          <Icon name='chevronDown' />
        </PlainButton>
      </div>
      <DisclosurePanel>
        <EncounterDetail
          encounter={encounter}
          event={event}
          onRecord={onRecord}
          onSave={onSave}
          setup={setup}
        />
      </DisclosurePanel>
    </Disclosure>
  )
}
