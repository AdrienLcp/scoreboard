import type React from 'react'

import type { Player } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'
import { type Side, sides } from '@scoreboard/protocol/side'

import { formatDuration } from '@/features/event/durations'
import { hotSideOf, matchCallOf } from '@/features/event/match-call'
import { MatchCallPill } from '@/features/event/match-call-pill'
import { sideName } from '@/features/event/participant-names'
import { numberedPeriods } from '@/features/event/periods'
import { toDate } from '@/infrastructure/dates'
import { Icon } from '@/presentation/components/icon'
import { RollingNumber } from '@/presentation/components/rolling-number'
import { TableNumber } from '@/presentation/components/table-number'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './live-tile.sass'

/** Past this many letters a name steps down a size rather than lose its end. */
const LONG_NAME_LENGTH = 15

type LiveTileProps = {
  /** The encounter's teams, for a match of a team encounter. */
  encounterTitle: string | null
  isOver: boolean
  match: MatchView
  nowMs: InstantMs
  players: readonly Player[]
}

/** One table on the big screen: its two sides, games won, and the score the room reads. */
export const LiveTile: React.FC<LiveTileProps> = ({
  encounterTitle,
  isOver,
  match,
  nowMs,
  players
}) => {
  const translate = useTranslate()
  const { state, timing } = match
  const call = isOver ? null : matchCallOf(match)
  const hotSide = hotSideOf(call)
  const nameOf = (side: Side): string =>
    sideName({ form: 'short', participant: match[side], players }) ??
    translate('match.unnamedSide')
  const label = [encounterTitle, match.label]
    .filter((part) => part !== null)
    .join(' · ')
  const scoreOf = (side: Side): number =>
    state.current === null ? state.periodsWon[side] : state.current[side]

  return (
    <article
      aria-label={translate('display.tileLabel', {
        away: nameOf('away'),
        home: nameOf('home'),
        score: `${scoreOf('home')}–${scoreOf('away')}`,
        table: match.table ?? 0
      })}
      className='live-tile'
      data-over={isOver || undefined}
      data-table={match.table ?? undefined}
    >
      <div className='tile-body'>
        <header className='tile-head'>
          <TableNumber number={match.table ?? 0} />
          <span className='tile-label'>{label}</span>
          <MatchCallPill call={call} isOver={isOver} match={match} />
        </header>
        {sides.map((side) => {
          const name = nameOf(side)

          return (
            <div
              className='tile-row'
              data-hot={hotSide === side || undefined}
              data-result={
                isOver ? (state.winner === side ? 'won' : 'lost') : undefined
              }
              key={side}
            >
              <span className='serve-mark'>
                {!isOver && state.serving === side ? (
                  <>
                    <Icon name='serve' />
                    <span className='visually-hidden'>
                      {translate('match.serving')}
                    </span>
                  </>
                ) : null}
                {isOver && state.winner === side ? (
                  <>
                    <Icon name='check' />
                    <span className='visually-hidden'>
                      {translate('match.winner')}
                    </span>
                  </>
                ) : null}
              </span>
              <span
                className='side-name'
                data-long={name.length > LONG_NAME_LENGTH || undefined}
              >
                {name}
              </span>
              <span className='games-won' data-empty={isOver || undefined}>
                {isOver ? null : (
                  <>
                    <span className='visually-hidden'>
                      {translate('match.gamesWon')}
                    </span>
                    <RollingNumber value={state.periodsWon[side]} />
                  </>
                )}
              </span>
              <span className='side-score'>
                <RollingNumber value={scoreOf(side)} />
              </span>
            </div>
          )
        })}
        <footer className='tile-foot'>
          {numberedPeriods(state.periods).map((period) => (
            <span key={period.number}>
              {period.home > period.away ? <b>{period.home}</b> : period.home}–
              {period.away > period.home ? <b>{period.away}</b> : period.away}
            </span>
          ))}
          <span className='tile-time'>
            {isOver && timing.finishedAtMs !== null
              ? translate('display.finishedAt', {
                  at: toDate(timing.finishedAtMs)
                })
              : null}
            {!isOver && timing.startedAtMs !== null
              ? formatDuration(translate, nowMs - timing.startedAtMs)
              : null}
          </span>
        </footer>
      </div>
    </article>
  )
}
