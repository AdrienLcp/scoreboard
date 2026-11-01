import type React from 'react'

import type { PlayerId, TableNumber } from '@scoreboard/protocol/identifiers'

import {
  DEFAULT_OPPONENT_COLOUR,
  textColourOn
} from '@scoreboard/core/club/team-colours'

import { absentSeatsLast } from '@/features/club/club-edits'
import { type Pick, PickField } from '@/features/club/pick-field'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { seatLetter } from './encounter-lineups'

import './encounter-lineup.sass'

/** One side of an encounter's sheet as its letters are picked. */
export type LineupSide = {
  /** What adding the typed name would do, or `null` when it will not do. */
  addLabel: (typed: string) => string | null
  colour: string
  emptyLabel: (typed: string) => string
  letters: readonly string[]
  lineup: readonly (PlayerId | null)[]
  onAdd: (typed: string) => PlayerId | null
  onChange: (lineup: (PlayerId | null)[]) => void
  picks: readonly Pick[]
  teamName: string
}

type EncounterLineupProps = {
  away: LineupSide
  groupCount: number
  /** The sheet's order, said under the tables. */
  hint: string
  home: LineupSide
  /** The encounter's tables in the order of its sheet's groups. */
  tables: readonly TableNumber[]
}

const LineupColumn: React.FC<{
  from: number
  side: LineupSide
  size: number
}> = ({ from, side, size }) => {
  const translate = useTranslate()

  return (
    <div
      className='encounter-lineup-column'
      data-white={
        side.colour.toUpperCase() === DEFAULT_OPPONENT_COLOUR || undefined
      }
      style={{ '--team': side.colour, '--team-ink': textColourOn(side.colour) }}
    >
      <span className='encounter-lineup-team'>{side.teamName}</span>
      {side.letters.slice(from, from + size).map((letter, offset) => (
        <PickField
          addLabel={side.addLabel}
          emptyLabel={side.emptyLabel}
          key={letter}
          label={letter}
          onAdd={side.onAdd}
          onChange={(playerId) =>
            side.onChange(
              seatLetter({
                index: from + offset,
                lineup: side.lineup,
                playerId
              })
            )
          }
          picks={side.picks}
          placeholder={translate('club.team.nobody')}
          selectedId={side.lineup.at(from + offset) ?? null}
        />
      ))}
    </div>
  )
}

/**
 * An encounter's compositions laid out as the hall plays them: one block per
 * table, its home letters beside its away letters, each picked from the
 * team's club; the sheet's official order said under them.
 */
export const EncounterLineup: React.FC<EncounterLineupProps> = ({
  away,
  groupCount,
  hint,
  home,
  tables
}) => {
  const translate = useTranslate()
  const groups = Array.from({ length: Math.max(groupCount, 1) }, (_, at) => at)
  const sizeOf = (side: LineupSide) => side.letters.length / groups.length

  return (
    <div className='encounter-lineup'>
      <div className='encounter-lineup-tables'>
        {groups.map((group) => {
          const table = tables.at(group)

          return (
            <div className='encounter-lineup-table' key={group}>
              <span className='encounter-lineup-plate'>
                {table === undefined
                  ? translate(
                      group === 0
                        ? 'organiser.encountersStep.firstTable'
                        : 'organiser.encountersStep.secondTable'
                    )
                  : translate('organiser.chooser.table', { table })}
              </span>
              <div className='encounter-lineup-columns'>
                {[home, away].map((side) => (
                  <LineupColumn
                    from={group * sizeOf(side)}
                    key={side.teamName}
                    side={side}
                    size={sizeOf(side)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {[home, away].map((side) => {
        const moved = absentSeatsLast({
          groupSize: sizeOf(side),
          letterCount: side.letters.length,
          lineup: side.lineup
        })

        return moved === null ? null : (
          <div className='club-lineup-absent' key={side.teamName}>
            <Icon name='move' />
            <p>
              {translate('organiser.clubEncounter.absentHint', {
                empty: side.letters
                  .slice(0, sizeOf(side))
                  .filter(
                    (_, index) => (side.lineup.at(index) ?? null) === null
                  )
                  .join(', '),
                later: `${side.letters.at(sizeOf(side)) ?? ''}–${side.letters.at(-1) ?? ''}`
              })}
            </p>
            <Button onPress={() => side.onChange(moved)} variant='quiet'>
              {translate('organiser.clubEncounter.absentMove')}
            </Button>
          </div>
        )
      })}
      <p className='encounter-lineup-hint'>{hint}</p>
    </div>
  )
}
