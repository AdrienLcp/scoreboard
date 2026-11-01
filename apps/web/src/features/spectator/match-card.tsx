import type React from 'react'

import type { Player } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { PlayerId } from '@scoreboard/protocol/identifiers'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'
import { type Side, sides } from '@scoreboard/protocol/side'

import { formatDuration } from '@/features/event/durations'
import { hotSideOf, matchCallOf } from '@/features/event/match-call'
import { MatchCallPill } from '@/features/event/match-call-pill'
import { sideName } from '@/features/event/participant-names'
import { wallCallOf } from '@/features/event/sheet-call'
import { startLabel } from '@/features/event/start-label'
import { toDate } from '@/infrastructure/dates'
import { PlainButton } from '@/presentation/components/button'
import {
  Disclosure,
  DisclosurePanel
} from '@/presentation/components/disclosure'
import { Icon } from '@/presentation/components/icon'
import { RollingNumber } from '@/presentation/components/rolling-number'
import { TableNumber } from '@/presentation/components/table-number'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { MatchDetail } from './match-detail'
import { SideMarks, sideMarksOf } from './side-marks'

import './match-card.sass'

type MatchCardProps = {
  encounterTitle: string | null
  /** Every match of its encounter, so a card follows a player from one match to the next. */
  encounterMatches: readonly MatchView[]
  followed: readonly PlayerId[]
  /** Opened from the start, when the visitor asked for this very match. */
  isOpenAtFirst?: boolean
  match: MatchView
  nowMs: InstantMs
  onFollow: (playerId: PlayerId, isFollowing: boolean) => void
  /** What to call a side nobody is named for yet, like the first of pool A in the bracket. */
  pendingNameOf?: (side: Side) => string
  players: readonly Player[]
}

/** One match on a visitor's phone: the score at a glance, game by game when opened. */
export const MatchCard: React.FC<MatchCardProps> = ({
  encounterMatches,
  encounterTitle,
  followed,
  isOpenAtFirst = false,
  match,
  nowMs,
  onFollow,
  pendingNameOf,
  players
}) => {
  const translate = useTranslate()
  const { state, timing } = match
  const isLive = state.status === 'live'
  const isScheduled = state.status === 'scheduled'
  const startMs = timing.estimatedStartMs ?? match.plannedAtMs
  const call = isLive ? matchCallOf(match) : null
  const hotSide = hotSideOf(call)
  const { concession } = state
  const isWalkover = concession?.reason === 'walkover'
  const nameOf = (side: Side): string =>
    sideName({ form: 'full', participant: match[side], players }) ??
    pendingNameOf?.(side) ??
    translate('match.unnamedSide')
  const isFollowedSide = (side: Side): boolean =>
    match[side].playerIds.some((id) => followed.includes(id))
  const label = [encounterTitle, wallCallOf(match)]
    .filter((part) => part !== null)
    .join(' · ')

  return (
    <Disclosure
      className='match-card'
      data-finished={!isLive || undefined}
      data-scheduled={isScheduled || undefined}
      defaultExpanded={isOpenAtFirst}
    >
      <PlainButton className='match-card-head' slot='trigger'>
        <span className='match-card-top'>
          <TableNumber number={match.table ?? 0} />
          <span className='match-card-label'>{label}</span>
          {isLive ? (
            call === null ? (
              timing.startedAtMs === null ? null : (
                <span className='match-card-when'>
                  {formatDuration(translate, nowMs - timing.startedAtMs)}
                </span>
              )
            ) : (
              <MatchCallPill call={call} match={match} />
            )
          ) : isScheduled ? (
            <span className='match-card-when'>
              {startMs === null
                ? translate('spectator.noTime')
                : startLabel({ nowMs, startMs, translate })}
            </span>
          ) : (
            <span className='match-card-when'>
              {timing.finishedAtMs === null
                ? null
                : translate(
                    isWalkover
                      ? 'spectator.walkoverAt'
                      : 'spectator.finishedAt',
                    { at: toDate(timing.finishedAtMs) }
                  )}
            </span>
          )}
          <Icon className='match-card-chevron' name='chevronDown' />
        </span>
        {sides.map((side) => {
          const isWinner = !isLive && state.winner === side
          const isLoser = !isLive && !isScheduled && !isWinner

          return (
            <span
              className='match-card-row'
              data-hot={hotSide === side || undefined}
              data-lost={isLoser || undefined}
              key={side}
            >
              <span className='match-card-mark'>
                {isLive && state.serving === side ? (
                  <>
                    <Icon name='serve' />
                    <span className='visually-hidden'>
                      {translate('match.serving')}
                    </span>
                  </>
                ) : null}
                {isWinner ? (
                  <>
                    <Icon name='check' />
                    <span className='visually-hidden'>
                      {translate('match.winner')}
                    </span>
                  </>
                ) : null}
              </span>
              <span
                className='match-card-name'
                data-pending={
                  match[side].playerIds.length === 0 &&
                  pendingNameOf !== undefined
                    ? true
                    : undefined
                }
              >
                <span>{nameOf(side)}</span>
                {isFollowedSide(side) ? <Icon name='star' /> : null}
                <SideMarks
                  {...sideMarksOf({
                    match,
                    matches: encounterMatches,
                    nowMs,
                    players,
                    side
                  })}
                />
              </span>
              {isLive ? (
                <span className='match-card-games'>
                  <span className='visually-hidden'>
                    {translate('match.gamesWon')}
                  </span>
                  <RollingNumber value={state.periodsWon[side]} />
                </span>
              ) : null}
              {isScheduled ? null : concession !== null && !isLive ? (
                <span className='match-card-concession'>
                  {isWinner
                    ? null
                    : translate(`match.concession.${concession.reason}`)}
                </span>
              ) : (
                <span className='match-card-score'>
                  <RollingNumber
                    value={
                      isLive && state.current !== null
                        ? state.current[side]
                        : state.periodsWon[side]
                    }
                  />
                </span>
              )}
            </span>
          )
        })}
      </PlainButton>
      <DisclosurePanel>
        <MatchDetail
          followed={followed}
          match={match}
          onFollow={onFollow}
          players={players}
        />
      </DisclosurePanel>
    </Disclosure>
  )
}
