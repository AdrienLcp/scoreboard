import { useEffect, useState } from 'react'

import type { EventId, PlayerId } from '@scoreboard/protocol/identifiers'

import {
  readFollowedPlayers,
  writeFollowedPlayers
} from '@/infrastructure/storage/followed-players-storage'

/** A device that cannot read storage starts with nobody followed rather than not at all. */
const storedOrNone = (eventId: EventId): PlayerId[] => {
  const stored = readFollowedPlayers(eventId)

  return stored.status === 'success' ? (stored.data ?? []) : []
}

/** The players this visitor follows: their matches come first on every tab. */
export const useFollowedPlayers = (eventId: EventId) => {
  const [followed, setFollowed] = useState<PlayerId[]>(() =>
    storedOrNone(eventId)
  )

  useEffect(() => {
    const written = writeFollowedPlayers({ eventId, playerIds: followed })

    if (written.status === 'failure') {
      console.warn(`Followed players not kept on this device: ${written.error}`)
    }
  }, [eventId, followed])

  return {
    follow: (playerId: PlayerId) =>
      setFollowed((current) =>
        current.includes(playerId) ? current : [...current, playerId]
      ),
    followed,
    unfollow: (playerId: PlayerId) =>
      setFollowed((current) => current.filter((id) => id !== playerId))
  }
}
