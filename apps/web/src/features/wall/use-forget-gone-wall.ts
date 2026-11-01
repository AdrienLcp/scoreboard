import { useEffect, useState } from 'react'

import type { DisplayId, EventId } from '@scoreboard/protocol/identifiers'

import { paths, useReplaceWith } from '@/infrastructure/router/navigation'
import {
  forgetPairedWall,
  isPairedWallOf
} from '@/infrastructure/storage/paired-wall-storage'

/**
 * Whether this device is the TV paired to the display it shows. Once that
 * display or its event is gone, the TV forgets it and goes back to `/wall`
 * for a fresh code instead of staying on an error.
 */
export const useForgetGoneWall = ({
  displayId,
  eventId,
  isGone
}: {
  displayId: DisplayId | null
  eventId: EventId
  isGone: boolean
}): boolean => {
  const replaceWith = useReplaceWith()
  const [isPairedWall] = useState(() => isPairedWallOf({ displayId, eventId }))

  useEffect(() => {
    if (isPairedWall && isGone) {
      forgetPairedWall()
      replaceWith(paths.wall)
    }
  }, [isGone, isPairedWall, replaceWith])

  return isPairedWall
}
