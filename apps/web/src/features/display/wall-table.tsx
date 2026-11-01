import type React from 'react'

import type { Player } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'
import { type Side, sides } from '@scoreboard/protocol/side'

import { runningTimeoutOf } from '@scoreboard/core/discipline/timeout-clock'

import { matchCallOf } from '@/features/event/match-call'
import { sideName } from '@/features/event/participant-names'
import { scoreText } from '@/features/event/score-text'
import { DrawnTable } from '@/presentation/components/drawn-table'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-context'
import { RichText } from '@/presentation/i18n/rich-text'

import {
  type TeamPaint,
  type WallTable as WallTableModel,
  wallCallOf,
  wallSideOf
} from './wall-rows'
import { WallTimeout } from './wall-timeout'

import './wall-table.sass'

const strong = (children: string): React.ReactNode => (
  <strong>{children}</strong>
)

/** One slot per game a side needs to win the match, numbered from the first. */
const gameSlotsOf = (match: MatchView): number[] =>
  Array.from(
    { length: Math.ceil(match.format.bestOf / 2) },
    (_, index) => index + 1
  )

const scoreOf = (match: MatchView, side: Side): number =>
  match.state.current?.[side] ?? 0

const teamStyle = (team: TeamPaint): React.CSSProperties => ({
  '--on-team': team.textColour,
  '--team': team.colour
})

/** The one word above a table that says what is at stake: a won game or match, a level score, the decider. */
const WallPill: React.FC<{ match: MatchView }> = ({ match }) => {
  const translate = useTranslate()
  const { awaiting, periodsWon } = match.state

  if (awaiting !== null) {
    const after = {
      ...periodsWon,
      [awaiting.side]: periodsWon[awaiting.side] + 1
    }

    return (
      <span className='wall-pill' data-tone='won'>
        <Icon name='check' />
        {awaiting.decides === 'match'
          ? translate('display.wall.matchWon', {
              score: scoreText(
                Math.max(after.home, after.away),
                Math.min(after.home, after.away)
              )
            })
          : translate('display.wall.gameWon')}
      </span>
    )
  }

  if (matchCallOf(match)?.kind === 'deuce') {
    return (
      <span className='wall-pill' data-tone='deuce'>
        {translate('display.wall.deuce')}
      </span>
    )
  }

  if (periodsWon.home + periodsWon.away === match.format.bestOf - 1) {
    return (
      <span className='wall-pill' data-tone='decider'>
        {translate('display.wall.decider')}
      </span>
    )
  }

  return null
}

type WallHalfProps = {
  encounterMatches: readonly MatchView[]
  /** What the letter square says when the sheet's letters do not apply: a pool number. */
  letters: string | null
  match: MatchView
  nowMs: InstantMs
  players: readonly Player[]
  side: Side
  team: TeamPaint
}

/** One end of a live table: the player's chip and marks at its corner, his games and score on the blue. */
const WallHalf: React.FC<WallHalfProps> = ({
  encounterMatches,
  letters,
  match,
  nowMs,
  players,
  side,
  team
}) => {
  const translate = useTranslate()
  const { state } = match
  const chip = wallSideOf({
    match,
    matches: encounterMatches,
    players,
    side
  })
  const running = runningTimeoutOf({
    lastTimeout: match.timing.lastTimeout,
    nowMs
  })
  const isTimeoutRunning = running?.side === side
  const hasTakenTimeout = state.timeouts[side] || isTimeoutRunning
  const won = state.periodsWon[side]
  const isLosingAwaited =
    state.awaiting !== null && state.awaiting.side !== side

  return (
    <div
      className='wall-half'
      data-side={side}
      data-white={team.isWhite || undefined}
      style={teamStyle(team)}
    >
      <div className='wall-corner'>
        <div className='wall-chip'>
          <span className='wall-letters'>{letters ?? chip.letters}</span>
          <span className='wall-names'>
            {chip.players.length === 0 ? (
              <span>{translate('match.unnamedSide')}</span>
            ) : (
              chip.players.map((player) => (
                <span key={player.id}>
                  {player.name}
                  {player.points === null ? null : (
                    <small className='wall-points'>{player.points}</small>
                  )}
                </span>
              ))
            )}
          </span>
          {state.serving === side ? (
            <span
              aria-label={translate('display.wall.serving')}
              className='wall-serve'
              role='img'
            />
          ) : null}
        </div>
        {chip.card === null && !hasTakenTimeout ? null : (
          <span className='wall-marks'>
            {chip.card === null ? null : (
              <span
                aria-label={translate(
                  chip.card === 0
                    ? 'display.wall.card'
                    : 'display.wall.cardPenalty'
                )}
                className='wall-card'
                data-penalty={chip.card === 0 ? undefined : true}
                role='img'
              />
            )}
            {hasTakenTimeout ? (
              <span
                aria-label={translate(
                  isTimeoutRunning
                    ? 'display.wall.timeoutRunning'
                    : 'display.wall.timeout'
                )}
                className='wall-stopwatch'
                data-running={isTimeoutRunning || undefined}
                role='img'
              >
                <Icon name='timer' />
              </span>
            ) : null}
          </span>
        )}
      </div>
      <div className='wall-score-row'>
        <span
          aria-label={translate('display.wall.gamesWon', { count: won })}
          className='wall-games'
          role='img'
        >
          {gameSlotsOf(match).map((slot) => (
            <i data-won={slot <= won || undefined} key={slot} />
          ))}
        </span>
        <span className='wall-score' data-dimmed={isLosingAwaited || undefined}>
          {scoreOf(match, side)}
        </span>
      </div>
    </div>
  )
}

type WallTableProps = {
  /** The matches whose cards follow a player onto this table: his encounter's, or his pool's. */
  encounterMatches: readonly MatchView[]
  /** A side's letter square when the sheet's letters do not apply. */
  lettersOf?: (match: MatchView, side: Side) => string
  nowMs: InstantMs
  /** The colour a side of the match wears: its team's, or its player's club's. */
  paintOf: (match: MatchView, side: Side) => TeamPaint
  players: readonly Player[]
  wallTable: WallTableModel
}

/** One table of the hall on the wall: its plate, its call, and the drawn table with the live match on it. */
export const WallTable: React.FC<WallTableProps> = ({
  encounterMatches,
  lettersOf,
  nowMs,
  paintOf,
  players,
  wallTable
}) => {
  const translate = useTranslate()
  const { live, next, table } = wallTable
  const nameOf = (match: MatchView, side: Side) =>
    sideName({ form: 'full', participant: match[side], players }) ??
    translate('match.unnamedSide')
  const running =
    live === null
      ? null
      : runningTimeoutOf({ lastTimeout: live.timing.lastTimeout, nowMs })

  return (
    <section
      aria-label={translate('table.name', { number: table })}
      className='wall-table'
    >
      <header className='wall-table-head'>
        <span className='wall-plate'>
          {translate('table.name', { number: table })}
        </span>
        <span className='wall-call'>
          {live === null ? translate('display.wall.waiting') : wallCallOf(live)}
        </span>
        {live === null ? null : <WallPill match={live} />}
      </header>
      <DrawnTable className='wall-court' isIdle={live === null}>
        {live === null ? (
          <div className='wall-free'>
            <b>{translate('display.wall.free')}</b>
            {next === null ? null : (
              <>
                <span>
                  {translate('display.wall.next', {
                    call: wallCallOf(next) ?? ''
                  })}
                </span>
                <span>
                  <RichText
                    parts={translate.rich('display.wall.nextPlayers', {
                      away: nameOf(next, 'away'),
                      b: strong,
                      home: nameOf(next, 'home')
                    })}
                  />
                </span>
              </>
            )}
          </div>
        ) : (
          <>
            {sides.map((side) => (
              <WallHalf
                encounterMatches={encounterMatches}
                key={side}
                letters={lettersOf?.(live, side) ?? null}
                match={live}
                nowMs={nowMs}
                players={players}
                side={side}
                team={paintOf(live, side)}
              />
            ))}
            {running === null ? null : (
              <WallTimeout remainingMs={running.remainingMs} />
            )}
          </>
        )}
      </DrawnTable>
    </section>
  )
}
