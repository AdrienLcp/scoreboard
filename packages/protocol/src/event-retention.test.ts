import { expect, it } from 'vitest'

import { EVENT_RETENTION_DAYS, eventErasureAtMs } from './event-retention'

/** 2026-10-14T18:30:00Z and, thirty days on, 2026-11-13T18:30:00Z. */
const CHANGED_AT_MS = 1_792_002_600_000
const THIRTY_DAYS_LATER_MS = 1_794_594_600_000

it('[retention] erases an event a month after its last change', () => {
  expect(EVENT_RETENTION_DAYS).toBe(30)
  expect(eventErasureAtMs(CHANGED_AT_MS)).toBe(THIRTY_DAYS_LATER_MS)
})
