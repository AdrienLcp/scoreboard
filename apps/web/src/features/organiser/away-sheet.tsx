import type React from 'react'

import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { TableNumber as TableNumberValue } from '@scoreboard/protocol/identifiers'

import { isDoublesLabel } from '@scoreboard/core/encounter/encounter-sheet'
import type { PutAwayDestination } from '@scoreboard/core/hall/table-put-away'

import { useClubTranslate } from '@/features/club/use-club-translate'
import { sideName } from '@/features/event/participant-names'
import { scoreText, versusText } from '@/features/event/score-text'
import { wallCallOf } from '@/features/event/sheet-call'
import { Button, PlainButton } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { TableNumber } from '@/presentation/components/table-number'

import './away-sheet.sass'

/** A call such as "B – Y" kept on one line: no break at its spaces nor after its dash. */
const unbreakable = (text: string): string =>
  text.replaceAll(' ', '\u00a0').replaceAll('–', '–\u2060')

type AwaySheetProps = {
  event: PublicSnapshot
  /** The standing tables it may go on to, in order. */
  free: readonly TableNumberValue[]
  /** The match running on the table about to be put away. */
  match: MatchView & { table: TableNumberValue }
  /** Keeps the table standing: nothing is put away. */
  onCancel: () => void
  onChoose: (destination: PutAwayDestination) => void
}

type AwayOptionProps = {
  detail: string
  isFirst: boolean
  onPress: () => void
  table: TableNumberValue | null
  title: string
}

const AwayOption: React.FC<AwayOptionProps> = ({
  detail,
  isFirst,
  onPress,
  table,
  title
}) => (
  <PlainButton autoFocus={isFirst} className='away-option' onPress={onPress}>
    <TableNumber number={table} />
    <span className='away-option-text'>
      <span className='away-option-title'>{title}</span>
      <span className='away-option-detail'>{detail}</span>
    </span>
    <Icon name='chevronRight' />
  </PlainButton>
)

/**
 * A table about to be put away while a match is played on it: the match, and
 * where it goes on, on a free table or waiting for the first one freed. Closing
 * keeps the table standing.
 */
export const AwaySheet: React.FC<AwaySheetProps> = ({
  event,
  free,
  match,
  onCancel,
  onChoose
}) => {
  const translate = useClubTranslate()
  const callOf = (shown: MatchView): string | null =>
    isDoublesLabel(shown.label)
      ? translate('display.wall.doubles')
      : wallCallOf(shown)
  const namesOf = (shown: MatchView): string =>
    versusText(
      sideName({
        form: 'family',
        participant: shown.home,
        players: event.players
      }) ?? translate('match.unnamedSide'),
      sideName({
        form: 'family',
        participant: shown.away,
        players: event.players
      }) ?? translate('match.unnamedSide')
    )
  const nextMatchOn = (table: TableNumberValue): MatchView | undefined => {
    const nextId = event.tables.find((view) => view.number === table)?.matchId
    const next = event.matches.find((candidate) => candidate.id === nextId)

    return next?.state.status === 'scheduled' ? next : undefined
  }
  const { current, periodsWon } = match.state
  const call = callOf(match)
  const keep = translate('organiser.plan.away.keep', { table: match.table })

  return (
    <section
      aria-labelledby='away-sheet-title away-sheet-question'
      className='away-sheet'
    >
      <header className='away-sheet-head'>
        <h3 id='away-sheet-title'>
          {translate('organiser.access.table', { table: match.table })}
        </h3>
        <Button aria-label={keep} onPress={onCancel} variant='quiet'>
          <Icon name='close' />
        </Button>
      </header>
      <p className='away-sheet-question' id='away-sheet-question'>
        {translate('organiser.plan.away.question')}
      </p>
      <div className='away-match'>
        <span aria-hidden='true' className='away-match-live' />
        <span className='away-match-who'>
          {call === null ? null : (
            <span className='away-match-call'>{call}</span>
          )}
          <span className='away-match-names'>{namesOf(match)}</span>
        </span>
        <span className='away-match-score'>
          {current === null
            ? scoreText(periodsWon.home, periodsWon.away)
            : scoreText(current.home, current.away)}
          {current === null ? null : (
            <small>{scoreText(periodsWon.home, periodsWon.away)}</small>
          )}
        </span>
      </div>
      <fieldset className='away-options'>
        <legend className='visually-hidden'>
          {translate('organiser.plan.away.options', { table: match.table })}
        </legend>
        {free.map((table, index) => {
          const next = nextMatchOn(table)

          return (
            <AwayOption
              detail={
                next === undefined
                  ? translate('organiser.plan.away.free')
                  : translate('organiser.plan.away.freeBefore', {
                      call: unbreakable(callOf(next) ?? namesOf(next))
                    })
              }
              isFirst={index === 0}
              key={table}
              onPress={() => onChoose(table)}
              table={table}
              title={translate('organiser.plan.away.onTable', { table })}
            />
          )
        })}
        <AwayOption
          detail={translate('organiser.plan.away.waitHint')}
          isFirst={free.length === 0}
          onPress={() => onChoose('waiting')}
          table={null}
          title={translate('organiser.plan.away.wait')}
        />
      </fieldset>
      <p className='away-sheet-hint'>
        {translate('organiser.plan.away.suite')}
      </p>
      <Button className='away-sheet-keep' onPress={onCancel} variant='quiet'>
        {keep}
      </Button>
    </section>
  )
}
