import { expect, it } from 'vitest'

import { EVENT_RETENTION_DAYS, eventErasureAtMs } from './event-retention'

/** 2026-10-14T18:30:00Z and, thirty days on, 2026-11-13T18:30:00Z. */
const CHANGED_AT_MS = 1_792_002_600_000
const THIRTY_DAYS_LATER_MS = 1_794_594_600_000
const SIXTY_DAYS_MS = 60 * 86_400_000

it('[retention] erases an event a month after its last change', () => {
  expect(EVENT_RETENTION_DAYS).toBe(30)
  expect(
    eventErasureAtMs({ changedAtMs: CHANGED_AT_MS, startsAtMs: null })
  ).toBe(THIRTY_DAYS_LATER_MS)
})

it('[retention] keeps an event prepared two months ahead a month past its start', () => {
  const startsAtMs = CHANGED_AT_MS + SIXTY_DAYS_MS

  expect(eventErasureAtMs({ changedAtMs: CHANGED_AT_MS, startsAtMs })).toBe(
    THIRTY_DAYS_LATER_MS + SIXTY_DAYS_MS
  )
})
