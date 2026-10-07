import type React from 'react'
import { useState } from 'react'

import type { Player } from '@scoreboard/protocol/event-setup'
import type { PlayerId } from '@scoreboard/protocol/identifiers'

import { PlainButton } from '@/presentation/components/button'
import {
  ComboBox,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover
} from '@/presentation/components/combo-box'
import { Icon } from '@/presentation/components/icon'
import { compareFrench } from '@/presentation/i18n/compare-french'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import './follow-field.sass'

type FollowFieldProps = {
  followed: readonly PlayerId[]
  onFollow: (playerId: PlayerId) => void
  onUnfollow: (playerId: PlayerId) => void
  players: readonly Player[]
  /** Where the player can be found now: a live table, later, or done. */
  whereIs: (playerId: PlayerId) => string
}

const isPlayerId = (
  key: unknown,
  players: readonly Player[]
): key is PlayerId => players.some((player) => player.id === key)

/**
 * Finds a player by name, case and accents set aside ("lena" finds Léna), and
 * follows them; the followed ones stay listed as chips.
 */
export const FollowField: React.FC<FollowFieldProps> = ({
  followed,
  onFollow,
  onUnfollow,
  players,
  whereIs
}) => {
  const translate = useTranslate()
  const [typed, setTyped] = useState('')
  const unfollowed = players
    .filter((player) => !followed.includes(player.id))
    .toSorted((left, right) => compareFrench(left.name, right.name))

  return (
    <div className='follow-field'>
      <ComboBox
        allowsEmptyCollection
        aria-label={translate('spectator.followPlayer')}
        defaultItems={unfollowed}
        inputValue={typed}
        menuTrigger='input'
        onInputChange={setTyped}
        onSelectionChange={(key) => {
          if (isPlayerId(key, players)) {
            onFollow(key)
            setTyped('')
          }
        }}
        selectedKey={null}
      >
        <Label className='visually-hidden'>
          {translate('spectator.followPlayer')}
        </Label>
        <div className='follow-field-box'>
          <Icon name='search' />
          <Input
            className='follow-field-input'
            placeholder={translate('spectator.followPlayer')}
          />
        </div>
        <Popover className='follow-field-popover'>
          <ListBox
            renderEmptyState={() => (
              <p className='follow-field-empty'>
                {translate('spectator.noPlayerMatches', { typed })}
              </p>
            )}
          >
            {(player: Player) => (
              <ListBoxItem id={player.id} textValue={player.name}>
                <span>{player.name}</span>
                <small>{whereIs(player.id)}</small>
              </ListBoxItem>
            )}
          </ListBox>
        </Popover>
      </ComboBox>
      {followed.length === 0 ? null : (
        <ul className='follow-chips'>
          {followed.map((playerId) => {
            const name =
              players.find((player) => player.id === playerId)?.name ?? ''

            return (
              <li key={playerId}>
                <Icon name='star' />
                <span>{name}</span>
                <PlainButton
                  aria-label={translate('spectator.unfollow', { name })}
                  className='follow-chip-remove'
                  onPress={() => onUnfollow(playerId)}
                >
                  <Icon name='close' />
                </PlainButton>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
