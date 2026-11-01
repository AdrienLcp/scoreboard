import { describe, expect, it } from 'vitest'

import type {
  ClubRecord,
  DirectoryClub
} from '@scoreboard/protocol/club-record'
import { EVENT_RETENTION_DAYS } from '@scoreboard/protocol/event-retention'

import { DEFAULT_OPPONENT_COLOUR } from '@scoreboard/core/club/team-colours'

import { logoIdsToDrop, type StoredLogoEntry } from './club-logos'

const NOW_MS = 1_800_000_000_000
const DAY_MS = 86_400_000
const EVENT_RETENTION_MS = EVENT_RETENTION_DAYS * DAY_MS

const logoUrlOf = (logoId: string) => `/api/logos/room/${logoId}`

const clubShowing = (logoId: string | null): DirectoryClub => ({
  id: crypto.randomUUID(),
  logoUrl: logoId === null ? null : logoUrlOf(logoId),
  name: 'PPC Angles',
  number: null,
  players: [],
  teams: []
})

const recordShowing = ({
  opponentLogoId = null,
  ownLogoId = null
}: {
  opponentLogoId?: string | null
  ownLogoId?: string | null
}): ClubRecord => ({
  hall: null,
  opponentColour: DEFAULT_OPPONENT_COLOUR,
  opponents: [clubShowing(opponentLogoId)],
  own: clubShowing(ownLogoId),
  pools: []
})

const droppedOf = (record: ClubRecord, stored: StoredLogoEntry[]) =>
  logoIdsToDrop({ logoUrlOf, nowMs: NOW_MS, record, stored })

describe('the logos dropped on an upload', () => {
  it("keeps the club's own logo and an opponent's, however old", () => {
    expect(
      droppedOf(recordShowing({ opponentLogoId: 'theirs', ownLogoId: 'own' }), [
        { logoId: 'own', storedAtMs: null },
        { logoId: 'theirs', storedAtMs: 0 }
      ])
    ).toEqual([])
  })

  it('keeps a logo the record no longer shows while an event may still show it', () => {
    expect(
      droppedOf(recordShowing({}), [
        { logoId: 'yesterday', storedAtMs: NOW_MS - DAY_MS },
        { logoId: 'retention-day', storedAtMs: NOW_MS - EVENT_RETENTION_MS }
      ])
    ).toEqual([])
  })

  it("drops a logo the record no longer shows once an event's retention has passed", () => {
    expect(
      droppedOf(recordShowing({}), [
        { logoId: 'outlived', storedAtMs: NOW_MS - EVENT_RETENTION_MS - 1 }
      ])
    ).toEqual(['outlived'])
  })

  it('counts a logo stored without its time as old', () => {
    expect(
      droppedOf(recordShowing({}), [{ logoId: 'untimed', storedAtMs: null }])
    ).toEqual(['untimed'])
  })
})
