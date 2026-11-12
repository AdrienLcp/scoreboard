import type React from 'react'

import { useSpectatorTranslate } from '@/features/spectator/use-spectator-translate'
import { Icon } from '@/presentation/components/icon'
import { ToggleButton } from '@/presentation/components/toggle-button-group'

import './follow-button.sass'

type FollowButtonProps = {
  isFollowing: boolean
  name: string
  onChange: (isFollowing: boolean) => void
}

/** Pins a player's matches on top of every tab, or lets them go. */
export const FollowButton: React.FC<FollowButtonProps> = ({
  isFollowing,
  name,
  onChange
}) => {
  const translate = useSpectatorTranslate()

  return (
    <ToggleButton
      className='follow-button'
      isSelected={isFollowing}
      onChange={onChange}
    >
      <Icon name={isFollowing ? 'star' : 'starOutline'} />
      {translate(isFollowing ? 'spectator.following' : 'spectator.follow', {
        name
      })}
    </ToggleButton>
  )
}
