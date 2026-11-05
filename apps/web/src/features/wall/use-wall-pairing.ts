import { useEffect, useEffectEvent, useState } from 'react'

import type { WallPairingCode } from '@scoreboard/protocol/identifiers'
import type { PairedWall } from '@scoreboard/protocol/routes'

import {
  openWallPairing,
  readWallPairing
} from '@/infrastructure/api/scoreboard-api'

/** Melee's pace: the screen follows the organiser's tap within a breath. */
const POLL_MS = 1500
const RETRY_MS = 5000

export type WallPairingView =
  | { status: 'opening' }
  | { status: 'offline' }
  | { code: WallPairingCode; status: 'waiting' }

/**
 * Draws a pairing code and asks every moment whether the organiser claimed
 * it. An expired code is replaced by a fresh one without a word; a dropped
 * network keeps the code on screen and keeps asking.
 */
export const useWallPairing = (
  onPaired: (wall: PairedWall) => void
): WallPairingView => {
  const [view, setView] = useState<WallPairingView>({ status: 'opening' })
  const announcePaired = useEffectEvent(onPaired)

  useEffect(() => {
    let isActive = true
    let timer: number | undefined

    const after = (delayMs: number, next: () => Promise<void>) => {
      timer = window.setTimeout(() => void next(), delayMs)
    }

    const poll = async (code: WallPairingCode): Promise<void> => {
      const read = await readWallPairing(code)

      if (!isActive) {
        return
      }

      if (read.status === 'success' && read.data.status === 'paired') {
        announcePaired({
          displayId: read.data.displayId,
          eventId: read.data.eventId
        })

        return
      }

      if (read.status === 'failure' && read.error === 'expired') {
        await open()

        return
      }

      after(POLL_MS, () => poll(code))
    }

    const open = async (): Promise<void> => {
      const opened = await openWallPairing()

      if (!isActive) {
        return
      }

      if (opened.status === 'failure') {
        setView({ status: 'offline' })
        after(RETRY_MS, open)

        return
      }

      setView({ code: opened.data.code, status: 'waiting' })
      after(POLL_MS, () => poll(opened.data.code))
    }

    void open()

    return () => {
      isActive = false
      window.clearTimeout(timer)
    }
  }, [])

  return view
}
