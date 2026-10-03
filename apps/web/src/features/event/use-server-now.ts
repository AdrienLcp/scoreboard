import { useEffect, useState } from 'react'

import type { InstantMs } from '@scoreboard/protocol/scoring-event'

import { nowMs } from '@/infrastructure/clock'

const SECOND_MS = 1000

type ClockOffset = {
  /** The snapshot time the offset was measured against. */
  measuredAt: InstantMs | null
  offsetMs: number
}

/**
 * The server's time, ticking on this device between snapshots: elapsed times
 * and the clock keep moving while nobody scores, and a device whose own clock
 * is wrong still shows the hall's time.
 */
export const useServerNow = (generatedAtMs: InstantMs | null): InstantMs => {
  const [offset, setOffset] = useState<ClockOffset>({
    measuredAt: null,
    offsetMs: 0
  })
  const [localNow, setLocalNow] = useState(nowMs)

  if (offset.measuredAt !== generatedAtMs) {
    setOffset({
      measuredAt: generatedAtMs,
      offsetMs: generatedAtMs === null ? 0 : generatedAtMs - nowMs()
    })
  }

  useEffect(() => {
    const timer = window.setInterval(() => setLocalNow(nowMs()), SECOND_MS)

    return () => window.clearInterval(timer)
  }, [])

  return localNow + offset.offsetMs
}
