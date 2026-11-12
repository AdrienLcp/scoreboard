import type React from 'react'

import type { Player } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { PlayerId } from '@scoreboard/protocol/identifiers'
import { type Side, sides } from '@scoreboard/protocol/side'

import { gamesToWinMatch } from '@scoreboard/core/table-tennis/table-tennis-game'

import { formatDuration } from '@/features/event/durations'
import { shortName, sideName } from '@/features/event/participant-names'
import { numberedPeriods } from '@/features/event/periods'
import { useSpectatorTranslate } from '@/features/spectator/use-spectator-translate'
import { toDate } from '@/infrastructure/clock'

import { FollowButton } from './follow-button'
import { CardMark, StopwatchMark } from './side-marks'

import './match-detail.sass'

type MatchDetailProps = {
  followed: readonly PlayerId[]
  match: MatchView
  onFollow: (playerId: PlayerId, isFollowing: boolean) => void
  players: readonly Player[]
  /** Who umpires it, when its encounter's sheet says so. */
  umpireName: string | null
}

/** A match opened on a visitor's phone: game by game, its times, its cards and time-outs. */
export const MatchDetail: React.FC<MatchDetailProps> = ({
  followed,
  match,
  onFollow,
  players,
  umpireName
}) => {
  const translate = useSpectatorTranslate()
  const { state, timing } = match
  const isLive = state.status === 'live'
  const nameOf = (side: Side): string =>
    sideName({ form: 'full', participant: match[side], players }) ??
    translate('match.unnamedSide')
  const playerName = (playerId: PlayerId | null, side: Side): string =>
    players.find((player) => player.id === playerId)?.name ?? nameOf(side)
  const lastPeriods =
    state.current === null ? state.periods : [...state.periods, state.current]
  const singlesPlayers = sides.flatMap((side) =>
    match[side].playerIds.length === 1
      ? players.filter((player) => player.id === match[side].playerIds[0])
      : []
  )
  const discipline = [
    ...state.cards.map((card) => ({
      key: card.id,
      kind: 'card' as const,
      penalty: card.penalty,
      text: translate(
        card.penalty === 0
          ? 'spectator.detail.card'
          : 'spectator.detail.cardPenalty',
        { name: playerName(card.playerId, card.side), points: card.penalty }
      )
    })),
    ...sides.flatMap((side) =>
      state.timeouts[side]
        ? [
            {
              key: side,
              kind: 'timeout' as const,
              penalty: 0,
              text: translate('spectator.detail.timeout', {
                name: nameOf(side)
              })
            }
          ]
        : []
    )
  ]

  return (
    <div className='match-detail'>
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
      {discipline.length === 0 ? null : (
        <ul className='match-detail-discipline'>
          {discipline.map((entry) => (
            <li key={entry.key}>
              {entry.kind === 'card' ? (
                <CardMark penalty={entry.penalty} />
              ) : (
                <StopwatchMark isRunning={false} />
              )}
              {entry.text}
            </li>
          ))}
        </ul>
      )}
      <p className='match-detail-meta'>
        {[
          umpireName === null
            ? null
            : translate('match.umpire', { name: umpireName }),
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
        <div className='match-detail-follow'>
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
  )
}
