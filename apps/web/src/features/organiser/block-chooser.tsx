import type React from 'react'

import type { EncounterId, TableNumber } from '@scoreboard/protocol/identifiers'

import { DEFAULT_OPPONENT_COLOUR } from '@scoreboard/core/club/team-colours'

import { useClubTranslate } from '@/features/club/use-club-translate'

import { Chooser, ChooserOption, HereMark } from './chooser'
import { TeamChip } from './team-chip'

import './block-chooser.sass'

/** An encounter as the choosers offer it: its teams in their colours and where it plays now. */
export type ChoosableEncounter = {
  awayName: string
  colours: { away: string; home: string } | null
  homeName: string
  id: EncounterId
  tables: readonly TableNumber[]
}

type BlockChooserProps = {
  encounters: readonly ChoosableEncounter[]
  first: TableNumber
  onChoose: (encounterId: EncounterId | null) => void
  onClose: () => void
  trigger: HTMLElement
}

/** "Table 7" for a block of one, "Tables 3–4" for a run. */
export const useTablesLabel = () => {
  const translate = useClubTranslate()

  return (tables: readonly TableNumber[]): string =>
    tables.length === 1
      ? translate('organiser.chooser.table', { table: tables[0] ?? 1 })
      : translate('organiser.chooser.tables', {
          tables: `${tables[0] ?? ''}–${tables.at(-1) ?? ''}`
        })
}

/** Both teams of an encounter in their colours. */
export const EncounterTeams: React.FC<{ encounter: ChoosableEncounter }> = ({
  encounter
}) => (
  <span className='block-chooser-teams'>
    <TeamChip
      colour={encounter.colours?.home ?? DEFAULT_OPPONENT_COLOUR}
      name={encounter.homeName}
    />
    <TeamChip
      colour={encounter.colours?.away ?? DEFAULT_OPPONENT_COLOUR}
      name={encounter.awayName}
    />
  </span>
)

/**
 * Which encounter plays on a block: the encounters in their colours, the one
 * already there marked; picking another swaps the two blocks' encounters.
 */
export const BlockChooser: React.FC<BlockChooserProps> = ({
  encounters,
  first,
  onChoose,
  onClose,
  trigger
}) => {
  const translate = useClubTranslate()
  const tablesLabel = useTablesLabel()
  const block = [first, first + 1]
  const current = encounters.find((encounter) =>
    encounter.tables.some((table) => block.includes(table))
  )

  return (
    <Chooser
      hint={
        current === undefined
          ? translate('organiser.chooser.blockFreeHint')
          : translate('organiser.chooser.blockHint', {
              encounter: `${current.homeName} – ${current.awayName}`
            })
      }
      onClose={onClose}
      title={translate('organiser.plan.chooseFor', {
        block: `${first}–${first + 1}`
      })}
      trigger={trigger}
    >
      {encounters.map((encounter) => (
        <ChooserOption
          isCurrent={encounter.id === current?.id}
          key={encounter.id}
          onPress={() => onChoose(encounter.id)}
        >
          <EncounterTeams encounter={encounter} />
          <span className='block-chooser-where'>
            {encounter.id === current?.id ? (
              <HereMark />
            ) : encounter.tables.length === 0 ? (
              translate('organiser.chooser.noTables')
            ) : (
              tablesLabel(encounter.tables)
            )}
          </span>
        </ChooserOption>
      ))}
      <ChooserOption
        isCurrent={current === undefined}
        onPress={() => onChoose(null)}
      >
        <span className='block-chooser-none'>
          {translate('organiser.plan.noEncounter')}
        </span>
        <span className='block-chooser-where'>
          {current === undefined ? (
            <HereMark />
          ) : (
            translate('organiser.chooser.freeTables')
          )}
        </span>
      </ChooserOption>
    </Chooser>
  )
}
