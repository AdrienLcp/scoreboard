import { useEffect, useState } from 'react'

import type { PublicSnapshot } from '@scoreboard/protocol/event-snapshot'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'

import { publicSnapshotFor } from '@scoreboard/core/event/public-snapshot'

import { nowMs as clockNowMs } from '@/infrastructure/clock'

import {
  advanceDemoDay,
  createDemoDay,
  type DemoDay,
  hasDemoDayRunOut
} from './demo-day'

const STEP_MS = 1_000

type DemoFrame = {
  day: DemoDay
  nowMs: InstantMs
}

const firstFrame = (): DemoFrame => {
  const nowMs = clockNowMs()

  return { day: createDemoDay(nowMs, Math.random), nowMs }
}

/**
 * The fictional day, played in this browser one step a second and started
 * again once a table has played its whole sheet: nothing reaches a server.
 */
export const useDemoSnapshot = (): {
  nowMs: InstantMs
  snapshot: PublicSnapshot
} => {
  const [frame, setFrame] = useState(firstFrame)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFrame((current) => {
        const nowMs = clockNowMs()

        return hasDemoDayRunOut(current.day)
          ? { day: createDemoDay(nowMs, Math.random), nowMs }
          : { day: advanceDemoDay(current.day, nowMs, Math.random), nowMs }
      })
    }, STEP_MS)

    return () => window.clearInterval(timer)
  }, [])

  return {
    nowMs: frame.nowMs,
    snapshot: publicSnapshotFor({
      logs: frame.day.logs,
      nowMs: frame.nowMs,
      setup: frame.day.setup
    })
  }
}
