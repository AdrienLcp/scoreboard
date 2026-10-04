import type React from 'react'

import type { Player } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { PlayerId } from '@scoreboard/protocol/identifiers'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'
import { type Side, sides } from '@scoreboard/protocol/side'

import { gamesToWinMatch } from '@scoreboard/core/table-tennis/table-tennis-game'

import { formatDuration } from '@/features/event/durations'
import { hotSideOf, matchCallOf } from '@/features/event/match-call'
import { MatchCallPill } from '@/features/event/match-call-pill'
import { shortName, sideName } from '@/features/event/participant-names'
import { numberedPeriods } from '@/features/event/periods'
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

import { FollowButton } from './follow-button'

import './match-card.sass'

type MatchCardProps = {
  encounterTitle: string | null
  followed: readonly PlayerId[]
  match: MatchView
  nowMs: InstantMs
  onFollow: (playerId: PlayerId, isFollowing: boolean) => void
  players: readonly Player[]
}

/** One match on a visitor's phone: the score at a glance, game by game when opened. */
export const MatchCard: React.FC<MatchCardProps> = ({
  encounterTitle,
  followed,
  match,
  nowMs,
  onFollow,
  players
}) => {
  const translate = useTranslate()
  const { state, timing } = match
  const isLive = state.status === 'live'
  const call = isLive ? matchCallOf(match) : null
  const hotSide = hotSideOf(call)
  const { concession } = state
  const isWalkover = concession?.reason === 'walkover'
  const nameOf = (side: Side): string =>
    sideName({ form: 'full', participant: match[side], players }) ??
    translate('match.unnamedSide')
  const isFollowedSide = (side: Side): boolean =>
    match[side].playerIds.some((id) => followed.includes(id))
  const label = [encounterTitle, match.label]
    .filter((part) => part !== null)
    .join(' · ')
  const lastPeriods =
    state.current === null ? state.periods : [...state.periods, state.current]
  const singlesPlayers = sides.flatMap((side) =>
    match[side].playerIds.length === 1
      ? players.filter((player) => player.id === match[side].playerIds[0])
      : []
  )

  return (
    <Disclosure className='match-card' data-finished={!isLive || undefined}>
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

          return (
            <span
              className='match-card-row'
              data-hot={hotSide === side || undefined}
              data-lost={(!isLive && !isWinner) || undefined}
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
              <span className='match-card-name'>
                <span>{nameOf(side)}</span>
                {isFollowedSide(side) ? <Icon name='star' /> : null}
              </span>
              {isLive ? (
                <span className='match-card-games'>
                  <span className='visually-hidden'>
                    {translate('match.gamesWon')}
                  </span>
                  <RollingNumber value={state.periodsWon[side]} />
                </span>
              ) : null}
              {concession !== null && !isLive ? (
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
        <div className='match-card-detail'>
          {lastPeriods.length === 0 ? null : (
            <table className='game-table'>
              <caption className='visually-hidden'>
                {translate('spectator.gameByGame')}
              </caption>
              <thead>
                <tr>
                  <th scope='col'>{translate('spectator.game')}</th>
                  {numberedPeriods(lastPeriods).map((period) => (
                    <th
                      data-current={
                        (isLive && period.number === lastPeriods.length) ||
                        undefined
                      }
                      key={period.number}
                      scope='col'
                    >
                      {period.number}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sides.map((side) => (
                  <tr key={side}>
                    <th scope='row'>{shortName(nameOf(side))}</th>
                    {numberedPeriods(lastPeriods).map((period) => {
                      const isCurrent =
                        isLive && period.number === lastPeriods.length
                      const other = side === 'home' ? 'away' : 'home'

                      return (
                        <td
                          data-current={isCurrent || undefined}
                          data-won={
                            (!isCurrent && period[side] > period[other]) ||
                            undefined
                          }
                          key={period.number}
                        >
                          {period[side]}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className='match-card-meta'>
            {[
              timing.startedAtMs === null
                ? null
                : timing.finishedAtMs === null
                  ? translate('timing.started', {
                      at: toDate(timing.startedAtMs)
                    })
                  : translate('spectator.playedFromTo', {
                      from: toDate(timing.startedAtMs),
                      to: toDate(timing.finishedAtMs)
                    }),
              timing.durationMs === null
                ? null
                : formatDuration(translate, timing.durationMs),
              translate('match.gamesToWin', {
                count: gamesToWinMatch(match.format.bestOf)
              })
            ]
              .filter((part) => part !== null)
              .join(' · ')}
          </p>
          {singlesPlayers.length === 0 ? null : (
            <div className='match-card-follow'>
              {singlesPlayers.map((player) => (
                <FollowButton
                  isFollowing={followed.includes(player.id)}
                  key={player.id}
                  name={player.name}
                  onChange={(isFollowing) => onFollow(player.id, isFollowing)}
                />
              ))}
            </div>
          )}
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}
