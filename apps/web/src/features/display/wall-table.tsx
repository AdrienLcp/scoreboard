import type React from 'react'

import type { Player } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { CardPenalty, InstantMs } from '@scoreboard/protocol/scoring-event'
import { type Side, sides } from '@scoreboard/protocol/side'

import { runningTimeoutOf } from '@scoreboard/core/discipline/timeout-clock'
import { isDoublesLabel } from '@scoreboard/core/encounter/encounter-sheet'

import { matchCallOf } from '@/features/event/match-call'
import { sideName } from '@/features/event/participant-names'
import { scoreText } from '@/features/event/score-text'
import { wallCallOf } from '@/features/event/sheet-call'
import { type ChipPlayer, wallSideOf } from '@/features/event/sheet-side'
import type { TeamPaint } from '@/features/event/team-paint'
import { DrawnTable } from '@/presentation/components/drawn-table'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-context'
import { RichText } from '@/presentation/i18n/rich-text'

import type { WallTable as WallTableModel } from './wall-rows'
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

/** The one word above a table that says what is at stake: a won game or match, a level score, the decider; over, how it ended. */
const WallPill: React.FC<{ isOver: boolean; match: MatchView }> = ({
  isOver,
  match
}) => {
  const translate = useTranslate()
  const { awaiting, concession, periodsWon } = match.state

  if (isOver) {
    return (
      <span className='wall-pill' data-tone='over'>
        <Icon name='check' />
        {concession === null
          ? translate('match.call.over')
          : translate(`match.concession.${concession.reason}`)}
      </span>
    )
  }

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

const WallCard: React.FC<{ penalty: CardPenalty }> = ({ penalty }) => {
  const translate = useTranslate()

  return (
    <span
      aria-label={translate(
        penalty === 0 ? 'display.wall.card' : 'display.wall.cardPenalty'
      )}
      className='wall-card'
      data-penalty={penalty === 0 ? undefined : true}
      role='img'
    />
  )
}

/** A player's line in a chip; in a doubles, the card he carries follows his name. */
const ChipLine: React.FC<{ isDoubles: boolean; player: ChipPlayer }> = ({
  isDoubles,
  player
}) => (
  <span className='wall-name'>
    <span className='wall-name-text'>{player.name}</span>
    {player.points === null ? null : (
      <small className='wall-points'>{player.points}</small>
    )}
    {isDoubles && player.card !== null ? (
      <WallCard penalty={player.card} />
    ) : null}
  </span>
)

type WallCornerProps = {
  encounterMatches: readonly MatchView[]
  /** The match just ended: no serve, no running time-out. */
  isOver: boolean
  /** What the letter square says when the sheet's letters do not apply: a pool number. */
  letters: string | null
  match: MatchView
  nowMs: InstantMs
  players: readonly Player[]
  side: Side
  team: TeamPaint
}

/**
 * A side's chip and marks, at its top corner of the table: beside the other
 * side's when both fit, under it, still on its own side, when the table is
 * too narrow for both.
 */
const WallCorner: React.FC<WallCornerProps> = ({
  encounterMatches,
  isOver,
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
  const running = isOver
    ? null
    : runningTimeoutOf({ lastTimeout: match.timing.lastTimeout, nowMs })
  const isTimeoutRunning = running?.side === side
  const hasTakenTimeout = state.timeouts[side] || isTimeoutRunning
  const isDoubles = chip.players.length > 1
  const markedCard = isDoubles ? chip.sideCard : chip.card

  return (
    <div
      className='wall-corner'
      data-side={side}
      data-white={team.isWhite || undefined}
      style={teamStyle(team)}
    >
      <div className='wall-chip'>
        <span className='wall-letters'>{letters ?? chip.letters}</span>
        <span className='wall-names'>
          {chip.players.length === 0 ? (
            <span>{translate('match.unnamedSide')}</span>
          ) : (
            chip.players.map((player) => (
              <ChipLine isDoubles={isDoubles} key={player.id} player={player} />
            ))
          )}
        </span>
        {!isOver && state.serving === side ? (
          <span
            aria-label={translate('display.wall.serving')}
            className='wall-serve'
            role='img'
          />
        ) : null}
      </div>
      {markedCard === null && !hasTakenTimeout ? null : (
        <span className='wall-marks'>
          {markedCard === null ? null : <WallCard penalty={markedCard} />}
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
  )
}

/** One end of a live table: its games and score on the blue; once over, the games won as the score. */
const WallHalf: React.FC<{ isOver: boolean; match: MatchView; side: Side }> = ({
  isOver,
  match,
  side
}) => {
  const translate = useTranslate()
  const { state } = match
  const won = state.periodsWon[side]
  const isDimmed = isOver
    ? state.winner !== null && state.winner !== side
    : state.awaiting !== null && state.awaiting.side !== side

  return (
    <div className='wall-half' data-side={side}>
      <div className='wall-score-row'>
        {isOver ? null : (
          <span
            aria-label={translate('display.wall.gamesWon', { count: won })}
            className='wall-games'
            role='img'
          >
            {gameSlotsOf(match).map((slot) => (
              <i data-won={slot <= won || undefined} key={slot} />
            ))}
          </span>
        )}
        <span className='wall-score' data-dimmed={isDimmed || undefined}>
          {isOver ? won : scoreOf(match, side)}
        </span>
      </div>
    </div>
  )
}

type WallTableProps = {
  /** The matches whose cards follow a player onto this table: his encounter's, or his pool's. */
  encounterMatches: readonly MatchView[]
  /** What the call starts with when the table's place does not say it: the match's pool. */
  tagOf?: (match: MatchView) => string | null
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
  tagOf,
  wallTable
}) => {
  const translate = useTranslate()
  const { isOver, live, next, table } = wallTable
  const callOf = (match: MatchView): string =>
    [
      tagOf?.(match) ?? null,
      isDoublesLabel(match.label)
        ? translate('display.wall.doubles')
        : wallCallOf(match)
    ]
      .filter((part) => part !== null)
      .join(' · ')
  const nameOf = (match: MatchView, side: Side) =>
    sideName({ form: 'full', participant: match[side], players }) ??
    translate('match.unnamedSide')
  const running =
    live === null || isOver
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
          {live === null ? translate('display.wall.waiting') : callOf(live)}
        </span>
        {live === null ? null : <WallPill isOver={isOver} match={live} />}
      </header>
      <DrawnTable className='wall-court' isIdle={live === null}>
        {live === null ? (
          <div className='wall-free'>
            <b>{translate('display.wall.free')}</b>
            {next === null ? null : (
              <>
                <span>
                  {translate('display.wall.next', {
                    call: callOf(next)
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
            <div className='wall-corners'>
              {sides.map((side) => (
                <WallCorner
                  encounterMatches={encounterMatches}
                  isOver={isOver}
                  key={side}
                  letters={lettersOf?.(live, side) ?? null}
                  match={live}
                  nowMs={nowMs}
                  players={players}
                  side={side}
                  team={paintOf(live, side)}
                />
              ))}
            </div>
            {sides.map((side) => (
              <WallHalf isOver={isOver} key={side} match={live} side={side} />
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
