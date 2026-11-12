import type React from 'react'

import type { Player } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { CardPenalty, InstantMs } from '@scoreboard/protocol/scoring-event'
import type { Side } from '@scoreboard/protocol/side'

import { runningTimeoutOf } from '@scoreboard/core/discipline/timeout-clock'

import { wallSideOf } from '@/features/event/sheet-side'
import { useSpectatorTranslate } from '@/features/spectator/use-spectator-translate'
import { Icon } from '@/presentation/components/icon'

import './side-marks.sass'

type TimeoutMark = 'none' | 'running' | 'taken'

/** The marks one side of a match carries, as the wall draws them. */
export type SideMarksProps = {
  /** The worst card a player of the side carries in the encounter. */
  card: CardPenalty | null
  timeout: TimeoutMark
}

export const sideMarksOf = ({
  match,
  matches,
  nowMs,
  players,
  side
}: {
  match: MatchView
  /** Every match of its encounter, or the match alone outside one. */
  matches: readonly MatchView[]
  nowMs: InstantMs
  players: readonly Player[]
  side: Side
}): SideMarksProps => {
  const running =
    match.state.status === 'live'
      ? runningTimeoutOf({ lastTimeout: match.timing.lastTimeout, nowMs })
      : null
  const isRunning = running?.side === side

  return {
    card: wallSideOf({
      match,
      matches: matches.length === 0 ? [match] : matches,
      players,
      side
    }).card,
    timeout: isRunning
      ? 'running'
      : match.state.timeouts[side]
        ? 'taken'
        : 'none'
  }
}

/** The tilted yellow card, split with red once it costs points. Decorative: its text says it. */
export const CardMark: React.FC<{ penalty: CardPenalty }> = ({ penalty }) => (
  <span
    aria-hidden='true'
    className='card-mark'
    data-penalty={penalty === 0 ? undefined : true}
  />
)

/** The stopwatch tile of a time-out, orange while it runs. Decorative: its text says it. */
export const StopwatchMark: React.FC<{ isRunning: boolean }> = ({
  isRunning
}) => (
  <span
    aria-hidden='true'
    className='stopwatch-mark'
    data-running={isRunning || undefined}
  >
    <Icon name='timer' />
  </span>
)

/** A side's card and time-out beside its name, each with a spoken label. */
export const SideMarks: React.FC<SideMarksProps> = ({ card, timeout }) => {
  const translate = useSpectatorTranslate()

  if (card === null && timeout === 'none') {
    return null
  }

  return (
    <span className='side-marks'>
      {card === null ? null : (
        <span
          aria-label={translate(
            card === 0 ? 'display.wall.card' : 'display.wall.cardPenalty'
          )}
          role='img'
        >
          <CardMark penalty={card} />
        </span>
      )}
      {timeout === 'none' ? null : (
        <span
          aria-label={translate(
            timeout === 'running'
              ? 'display.wall.timeoutRunning'
              : 'display.wall.timeout'
          )}
          role='img'
        >
          <StopwatchMark isRunning={timeout === 'running'} />
        </span>
      )}
    </span>
  )
}
