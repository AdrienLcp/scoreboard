import type React from 'react'

import type { TableNumber } from '@scoreboard/protocol/identifiers'

import { DEFAULT_OPPONENT_COLOUR } from '@scoreboard/core/club/team-colours'

import { useClubTranslate } from '@/features/club/use-club-translate'

import { type ChoosableEncounter, useTablesLabel } from './block-chooser'
import { Chooser, ChooserOption, HereMark } from './chooser'
import { TeamChip } from './team-chip'

/** A block standing in the hall: its tables, and how many of them are set up today. */
export type StandingBlock = {
  first: TableNumber
  standing: number
  tables: readonly TableNumber[]
}

type TablesChooserProps = {
  blocks: readonly StandingBlock[]
  encounter: ChoosableEncounter
  encounters: readonly ChoosableEncounter[]
  onChoose: (first: TableNumber) => void
  onClose: () => void
  /** The block an option points at while hovered or focused, `null` once it leaves. */
  onPreview: (first: TableNumber | null) => void
  trigger: HTMLElement
}

const isOn = (encounter: ChoosableEncounter, block: StandingBlock): boolean =>
  encounter.tables.some((table) => block.tables.includes(table))

/**
 * Where an encounter plays: every block standing in the hall, the one it is
 * on marked, what plays on the others now; an encounter already on the
 * block picked takes the tables it leaves.
 */
export const TablesChooser: React.FC<TablesChooserProps> = ({
  blocks,
  encounter,
  encounters,
  onChoose,
  onClose,
  onPreview,
  trigger
}) => {
  const translate = useClubTranslate()
  const tablesLabel = useTablesLabel()

  return (
    <Chooser
      hint={
        encounter.tables.length === 0
          ? translate('organiser.chooser.tablesUnseatedHint')
          : translate('organiser.chooser.tablesHint', {
              tables: encounter.tables.join('–')
            })
      }
      onClose={() => {
        onPreview(null)
        onClose()
      }}
      title={translate('organiser.chooser.playsOn', {
        encounter: `${encounter.homeName} – ${encounter.awayName}`
      })}
      trigger={trigger}
    >
      {blocks.map((block) => {
        const isHere = isOn(encounter, block)
        const other = encounters.find(
          (candidate) => candidate.id !== encounter.id && isOn(candidate, block)
        )
        const preview = (isPointed: boolean) =>
          onPreview(isPointed ? block.first : null)

        return (
          <ChooserOption
            isCurrent={isHere}
            key={block.first}
            onFocusChange={preview}
            onHoverChange={preview}
            onPress={() => onChoose(block.first)}
          >
            <span className='block-chooser-block'>
              <b>{tablesLabel(block.tables)}</b>
              {block.standing < 2 ? (
                <small>{translate('organiser.chooser.singleTable')}</small>
              ) : null}
            </span>
            <span className='block-chooser-what'>
              {isHere ? (
                <HereMark />
              ) : other === undefined ? (
                translate('organiser.chooser.free')
              ) : (
                <>
                  <TeamChip
                    colour={other.colours?.home ?? DEFAULT_OPPONENT_COLOUR}
                    name={other.homeName}
                  />
                  {translate('organiser.chooser.playsThere')}
                </>
              )}
            </span>
          </ChooserOption>
        )
      })}
    </Chooser>
  )
}
