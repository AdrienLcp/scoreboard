import type React from 'react'

import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { TableNumber } from '@scoreboard/protocol/identifiers'

import { isDoublesLabel } from '@scoreboard/core/encounter/encounter-sheet'

import { sideName } from '@/features/event/participant-names'
import { scoreText } from '@/features/event/score-text'
import { wallCallOf } from '@/features/event/sheet-call'
import { PlainButton } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { LivePill } from './live-pill'
import { liveTableStateOf, matchesWithoutTableOf } from './live-state'

import './live-rows.sass'

type LiveRowsProps = {
  event: PublicSnapshot
  onPick: (table: TableNumber) => void
  selected: TableNumber | null
  /** The tables to list, in number order. */
  tables: readonly TableNumber[]
}

/** The point score and, under it, the games each side has won. */
const LiveScore: React.FC<{ match: MatchView }> = ({ match }) => {
  const { current, periodsWon } = match.state

  return (
    <span className='live-row-score'>
      {current === null ? null : scoreText(current.home, current.away)}
      <small>{scoreText(periodsWon.home, periodsWon.away)}</small>
    </span>
  )
}

/**
 * Every table and what it is playing, one row each, the matches no table
 * holds first: a tap on a table's row opens it, as a tap on the plan does.
 */
export const LiveRows: React.FC<LiveRowsProps> = ({
  event,
  onPick,
  selected,
  tables
}) => {
  const translate = useTranslate()
  const callOf = (match: MatchView): string =>
    isDoublesLabel(match.label)
      ? translate('display.wall.doubles')
      : (wallCallOf(match) ?? '')
  const namesOf = (match: MatchView): string =>
    [match.home, match.away]
      .map(
        (participant) =>
          sideName({ form: 'family', participant, players: event.players }) ??
          translate('match.unnamedSide')
      )
      .join(' · ')

  return (
    <ul className='live-rows'>
      {matchesWithoutTableOf(event).map((match) => (
        <li key={match.id}>
          <div className='live-row' data-waiting>
            <span className='live-row-plate'>
              <Icon name='timer' />
            </span>
            <span className='live-row-text'>
              <span className='live-row-call'>
                {[translate('organiser.live.waiting'), callOf(match)]
                  .filter((part) => part !== '')
                  .join(' · ')}
              </span>
              <span className='live-row-names'>{namesOf(match)}</span>
            </span>
            {match.state.status === 'scheduled' ? null : (
              <LiveScore match={match} />
            )}
          </div>
        </li>
      ))}
      {tables.map((table) => {
        const state = liveTableStateOf(event, table)

        return (
          <li key={table}>
            <PlainButton
              aria-pressed={selected === table}
              className='live-row'
              data-live-row={table}
              onPress={() => onPick(table)}
            >
              <span className='live-row-plate'>
                <span className='visually-hidden'>
                  {translate('table.prefix')}
                </span>
                {table}
              </span>
              <span className='live-row-text'>
                <span className='live-row-call'>
                  {state.kind === 'free'
                    ? translate('organiser.live.freeTable')
                    : state.kind === 'next'
                      ? translate('organiser.live.next', {
                          call: callOf(state.match)
                        })
                      : callOf(state.match)}
                </span>
                {state.kind === 'free' ? null : (
                  <span className='live-row-names'>{namesOf(state.match)}</span>
                )}
              </span>
              {state.kind === 'live' && state.pill !== null ? (
                <LivePill pill={state.pill} />
              ) : null}
              {state.kind === 'live' ? <LiveScore match={state.match} /> : null}
            </PlainButton>
          </li>
        )
      })}
    </ul>
  )
}
