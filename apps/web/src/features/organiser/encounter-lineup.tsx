import type React from 'react'
import { useState } from 'react'
import { Button as AriaButton } from 'react-aria-components'

import type { PlayerId, TableNumber } from '@scoreboard/protocol/identifiers'
import type { Side } from '@scoreboard/protocol/side'

import {
  DEFAULT_OPPONENT_COLOUR,
  textColourOn
} from '@scoreboard/core/club/team-colours'

import { absentSeatsLast } from '@/features/club/club-edits'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { Input, TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import type { RosterGroup, RosterRow } from './encounter-roster'

import '@/features/club/pick-field.sass'
import './encounter-lineup.sass'

/** Why the FFTT's licensees are missing from a roster. */
export type RosterNotice = 'down' | 'loading' | 'offline'

/** One side of an encounter's sheet as its letters are picked. */
export type LineupSide = {
  /** What adding the typed name would do, or `null` when it will not do. */
  addLabel: (typed: string) => string | null
  /** The club the roster lists, `null` for a team without one. */
  clubName: string | null
  colour: string
  letters: readonly string[]
  lineup: readonly (PlayerId | null)[]
  /** Whether the roster holds the FFTT's licensees, credited under it. */
  hasFederation: boolean
  /** Shown at the top of the roster: the FFTT search of a club not tied yet. */
  link: React.ReactNode
  notice: RosterNotice | null
  onAdd: (typed: string) => PlayerId | null
  onChange: (lineup: (PlayerId | null)[]) => void
  /** Seats a roster row's pick on a letter, `null` freeing it. */
  onPick: (index: number, pick: string | null) => void
  roster: (typed: string) => RosterGroup[]
  /** Who holds each letter, as the slot shows him. */
  seated: readonly ({ name: string; points: number | null } | null)[]
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

type Focus = { index: number; side: Side }

const teamStyleOf = (colour: string): React.CSSProperties => ({
  '--team': colour,
  '--team-ink': textColourOn(colour)
})

const isWhite = (colour: string) =>
  colour.toUpperCase() === DEFAULT_OPPONENT_COLOUR || undefined

/** Splits a "first family" name for the slot: the family name carries it, the first name under it. */
const slotNameOf = (name: string) => {
  const [first = '', ...rest] = name.split(' ')

  return rest.length === 0
    ? { first: '', last: first }
    : { first, last: rest.join(' ') }
}

const LetterSlot: React.FC<{
  colour: string
  isCurrent: boolean
  letter: string
  onPress: () => void
  seated: LineupSide['seated'][number]
}> = ({ colour, isCurrent, letter, onPress, seated }) => {
  const translate = useTranslate()
  const name = seated === null ? null : slotNameOf(seated.name)

  return (
    <AriaButton
      aria-current={isCurrent || undefined}
      className='lineup-slot'
      data-white={isWhite(colour)}
      onPress={onPress}
      style={teamStyleOf(colour)}
    >
      <span className='lineup-slot-letter'>{letter}</span>
      {name === null ? (
        <span className='lineup-slot-empty'>
          {translate('organiser.pick.roster.choose')}
        </span>
      ) : (
        <>
          <span className='lineup-slot-name'>
            <span className='lineup-slot-last'>{name.last}</span>
            {name.first === '' ? null : (
              <span className='lineup-slot-first'>{name.first}</span>
            )}
          </span>
          {seated?.points === null || seated === null ? null : (
            <span className='lineup-slot-points'>{seated.points}</span>
          )}
        </>
      )}
    </AriaButton>
  )
}

const RosterLine: React.FC<{
  isHeld: boolean
  onPick: () => void
  row: RosterRow
}> = ({ isHeld, onPick, row }) => {
  const translate = useTranslate()

  return (
    <AriaButton
      className='lineup-roster-row'
      isDisabled={row.seat !== null && !isHeld}
      onPress={onPick}
    >
      <span className='lineup-roster-points'>{row.points ?? '–'}</span>
      <span className='lineup-roster-who'>
        <span className='lineup-roster-name'>{row.name}</span>
        <span className='lineup-roster-detail'>
          {row.source === 'fftt' ? (
            <span className='lineup-roster-licence'>{row.licence}</span>
          ) : (
            <span>
              <Icon name='edit' />
              {translate('organiser.pick.roster.typedMark')}
            </span>
          )}
        </span>
      </span>
      {row.seat === null ? null : (
        <span className='lineup-roster-seat'>{row.seat}</span>
      )}
    </AriaButton>
  )
}

const GROUP_ICONS = {
  day: null,
  licensees: 'club',
  played: 'teams',
  typed: 'edit'
} as const

const LineupRoster: React.FC<{
  focus: Focus
  onClose: () => void
  onPicked: (index: number, pick: string | null) => void
  side: LineupSide
}> = ({ focus, onClose, onPicked, side }) => {
  const translate = useTranslate()
  const [typed, setTyped] = useState('')
  const letter = side.letters.at(focus.index) ?? ''
  const groups = side.roster(typed)
  const held = side.lineup.at(focus.index) ?? null
  const addLabel = side.addLabel(typed)
  const pick = (next: string | null) => {
    setTyped('')
    onPicked(focus.index, next)
  }
  const headingOf = (group: RosterGroup) => {
    switch (group.kind) {
      case 'played':
        return translate('organiser.pick.roster.playedFor', {
          team: side.teamName
        })
      case 'licensees':
        return translate('organiser.pick.roster.licensees', {
          club: side.clubName ?? side.teamName
        })
      case 'typed':
        return translate('organiser.pick.roster.typed')
      case 'day':
        return null
    }
  }

  return (
    <aside
      aria-label={side.teamName}
      className='lineup-roster'
      data-white={isWhite(side.colour)}
      style={teamStyleOf(side.colour)}
    >
      <div className='lineup-roster-head'>
        <span className='lineup-roster-letter'>{letter}</span>
        <h3 className='lineup-roster-team'>{side.teamName}</h3>
        {held === null ? null : (
          <Button onPress={() => pick(null)} variant='quiet'>
            {translate('organiser.pick.roster.free')}
          </Button>
        )}
        <Button
          aria-label={translate('organiser.pick.roster.close')}
          onPress={onClose}
          variant='quiet'
        >
          <Icon name='close' />
        </Button>
      </div>
      <TextField
        aria-label={translate('organiser.pick.roster.search')}
        className='lineup-roster-search'
        onChange={setTyped}
        value={typed}
      >
        <div className='pick-field-box'>
          <Icon name='search' />
          <Input
            autoComplete='off'
            className='field-input pick-field-input'
            placeholder={translate('organiser.pick.roster.search')}
          />
        </div>
      </TextField>
      <div className='lineup-roster-list'>
        {side.link}
        {side.notice === null ? null : (
          <p
            className='lineup-roster-notice'
            data-alarm={side.notice !== 'loading' || undefined}
            role={side.notice === 'loading' ? undefined : 'alert'}
          >
            <Icon
              name={
                side.notice === 'offline'
                  ? 'wifiOff'
                  : side.notice === 'down'
                    ? 'alert'
                    : 'sync'
              }
            />
            {side.notice === 'loading'
              ? translate('organiser.pick.roster.loading', {
                  club: side.clubName ?? side.teamName
                })
              : translate(`organiser.pick.roster.${side.notice}`)}
          </p>
        )}
        {groups.map((group) => {
          const heading = headingOf(group)
          const icon = GROUP_ICONS[group.kind]

          return (
            <section className='lineup-roster-group' key={group.kind}>
              {heading === null ? null : (
                <h4 className='lineup-roster-heading'>
                  {icon === null ? null : <Icon name={icon} />}
                  {heading}
                  <span className='lineup-roster-count'>
                    {group.rows.length}
                  </span>
                </h4>
              )}
              {group.rows.map((row) => (
                <RosterLine
                  isHeld={row.id === held}
                  key={row.id}
                  onPick={() => pick(row.id)}
                  row={row}
                />
              ))}
            </section>
          )
        })}
        {groups.length === 0 && typed.trim() !== '' ? (
          <div className='lineup-roster-empty'>
            <p>{translate('organiser.pick.roster.noMatch', { typed })}</p>
            {addLabel === null ? null : (
              <Button
                onPress={() => {
                  const added = side.onAdd(typed)

                  if (added !== null) {
                    pick(added)
                  }
                }}
              >
                <Icon name='plus' />
                {addLabel}
              </Button>
            )}
          </div>
        ) : null}
      </div>
      {side.hasFederation ? (
        <p className='lineup-roster-source'>
          {translate('club.federation.source')}
        </p>
      ) : null}
    </aside>
  )
}

/** The next letter still empty after the one just filled, going round; `null` when the side is full. */
const nextEmptyOf = (side: LineupSide, from: number): number | null => {
  const count = side.letters.length

  for (let step = 1; step < count; step += 1) {
    const index = (from + step) % count

    if ((side.lineup.at(index) ?? null) === null) {
      return index
    }
  }

  return null
}

/**
 * An encounter's compositions laid out as the hall plays them: one block per
 * table, its home letters beside its away letters. A letter opens its team's
 * roster, best first; one tap seats a player and the next empty letter comes
 * up by itself.
 */
export const EncounterLineup: React.FC<EncounterLineupProps> = ({
  away,
  groupCount,
  hint,
  home,
  tables
}) => {
  const translate = useTranslate()
  const [focus, setFocus] = useState<Focus | null>(null)
  const sides = { away, home }
  const groups = Array.from({ length: Math.max(groupCount, 1) }, (_, at) => at)
  const sizeOf = (side: LineupSide) => side.letters.length / groups.length

  const picked = (side: Side, index: number, pick: string | null) => {
    const lineupSide = sides[side]
    lineupSide.onPick(index, pick)

    if (pick === null) {
      return
    }

    const next = nextEmptyOf(lineupSide, index)
    setFocus(next === null ? null : { index: next, side })
  }

  return (
    <div className='encounter-lineup' data-roster={focus !== null || undefined}>
      <div className='encounter-lineup-sheet'>
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
                  {(['home', 'away'] as const).map((sideName) => {
                    const side = sides[sideName]
                    const from = group * sizeOf(side)

                    return (
                      <div className='encounter-lineup-column' key={sideName}>
                        <span className='encounter-lineup-team'>
                          {side.teamName}
                        </span>
                        {side.letters
                          .slice(from, from + sizeOf(side))
                          .map((letter, offset) => (
                            <LetterSlot
                              colour={side.colour}
                              isCurrent={
                                focus?.side === sideName &&
                                focus.index === from + offset
                              }
                              key={letter}
                              letter={letter}
                              onPress={() =>
                                setFocus({
                                  index: from + offset,
                                  side: sideName
                                })
                              }
                              seated={side.seated.at(from + offset) ?? null}
                            />
                          ))}
                      </div>
                    )
                  })}
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
      {focus === null ? null : (
        <LineupRoster
          focus={focus}
          key={`${focus.side}-${focus.index}`}
          onClose={() => setFocus(null)}
          onPicked={(index, pick) => picked(focus.side, index, pick)}
          side={sides[focus.side]}
        />
      )}
    </div>
  )
}
