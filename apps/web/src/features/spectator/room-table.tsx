import type React from 'react'

import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { PlayerId } from '@scoreboard/protocol/identifiers'
import { type Side, sides } from '@scoreboard/protocol/side'

import { gamesToWinMatch } from '@scoreboard/core/table-tennis/table-tennis-game'

import { sideName } from '@/features/event/participant-names'
import { wallCallOf } from '@/features/event/sheet-call'
import { PlainButton } from '@/presentation/components/button'
import { DrawnTable } from '@/presentation/components/drawn-table'
import { Icon } from '@/presentation/components/icon'
import { RollingNumber } from '@/presentation/components/rolling-number'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { type RoomTable as RoomTableModel, sidePaintOf } from './room-layout'

import './room-table.sass'

type RoomTableProps = {
  followed: readonly PlayerId[]
  isSelected: boolean
  onPress: () => void
  roomTable: RoomTableModel
  snapshot: PublicSnapshot
}

const gameSlotsOf = (match: MatchView): number[] =>
  Array.from(
    { length: gamesToWinMatch(match.format.bestOf) },
    (_, index) => index + 1
  )

/**
 * One table where it stands on the visitor's plan: its number and call, the
 * drawn table with each side's games won, the point score big below it and
 * who plays, by family name on a narrow plan.
 */
export const RoomTable: React.FC<RoomTableProps> = ({
  followed,
  isSelected,
  onPress,
  roomTable,
  snapshot
}) => {
  const translate = useTranslate()
  const { column, live, next, row, table } = roomTable
  const shown = live ?? next
  const call = shown === null ? null : wallCallOf(shown)
  const nameOf = (match: MatchView, side: Side, form: 'family' | 'short') =>
    sideName({ form, participant: match[side], players: snapshot.players }) ??
    translate('match.unnamedSide')
  const isFollowed =
    shown !== null &&
    sides.some((side) =>
      shown[side].playerIds.some((playerId) => followed.includes(playerId))
    )

  return (
    <PlainButton
      aria-pressed={isSelected}
      className='room-table'
      data-free={live === null || undefined}
      onPress={onPress}
      style={{ '--room-column': column, '--room-row': row }}
    >
      <span className='room-table-head'>
        <span className='room-plate'>
          <span className='visually-hidden'>{translate('table.prefix')}</span>
          {table}
        </span>
        <span className='room-call'>
          {live !== null
            ? call
            : next === null || call === null
              ? null
              : translate('spectator.room.next', { call })}
        </span>
        {isFollowed ? (
          <span className='room-followed'>
            <Icon name='star' />
            <span className='visually-hidden'>
              {translate('spectator.yourPlayers')}
            </span>
          </span>
        ) : null}
      </span>
      <DrawnTable className='room-court' isIdle={live === null}>
        {live === null
          ? null
          : sides.map((side) => (
              <span
                aria-label={translate('display.wall.gamesWon', {
                  count: live.state.periodsWon[side]
                })}
                className='room-games'
                data-side={side}
                key={side}
                role='img'
              >
                {gameSlotsOf(live).map((slot) => (
                  <i
                    data-won={slot <= live.state.periodsWon[side] || undefined}
                    key={slot}
                  />
                ))}
              </span>
            ))}
      </DrawnTable>
      {live === null ? (
        <span className='room-free'>{translate('spectator.room.free')}</span>
      ) : (
        <span className='room-scores'>
          {sides.map((side) => (
            <span
              className='room-score'
              data-dimmed={
                (live.state.awaiting !== null &&
                  live.state.awaiting.side !== side) ||
                undefined
              }
              data-side={side}
              key={side}
            >
              <RollingNumber value={live.state.current?.[side] ?? 0} />
              {live.state.serving === side ? (
                <>
                  <Icon name='serve' />
                  <span className='visually-hidden'>
                    {translate('match.serving')}
                  </span>
                </>
              ) : null}
            </span>
          ))}
        </span>
      )}
      <span className='room-names' data-awaited={live === null || undefined}>
        {shown === null
          ? null
          : sides.map((side) => {
              const paint = sidePaintOf({ match: shown, side, snapshot })

              return (
                <span
                  className='room-name'
                  data-side={side}
                  data-white={paint.isWhite || undefined}
                  key={side}
                  style={{ '--team': paint.colour }}
                >
                  <span className='room-name-family'>
                    {nameOf(shown, side, 'family')}
                  </span>
                  <span className='room-name-short'>
                    {nameOf(shown, side, 'short')}
                  </span>
                </span>
              )
            })}
      </span>
    </PlainButton>
  )
}
