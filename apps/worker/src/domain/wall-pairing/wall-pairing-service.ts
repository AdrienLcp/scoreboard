import { Result } from '@adrienlcp/result'

import type { WallPairingCode } from '@scoreboard/protocol/identifiers'
import type {
  ClaimWallPairingInput,
  OpenedWallPairing
} from '@scoreboard/protocol/routes'

import {
  type DrawCode,
  newWallPairingCode
} from '@scoreboard/core/access/access-codes'

import type { EventRooms } from '@/domain/event/event-rooms'

import type { WallPairings } from './wall-pairings'

/** A code is drawn at random; a clash with a screen still waiting is retried. */
const OPEN_ATTEMPTS = 3

export const openWallPairingFor = async ({
  drawCode,
  pairings
}: {
  drawCode: DrawCode
  pairings: WallPairings
}): Promise<Result<OpenedWallPairing, 'no_free_pairing_code'>> => {
  for (let attempt = 0; attempt < OPEN_ATTEMPTS; attempt++) {
    const code = newWallPairingCode(drawCode)
    const opened = await pairings.open(code)

    if (opened.status === 'success') {
      return Result.success({ code, expiresAtMs: opened.data.expiresAtMs })
    }
  }

  return Result.failure('no_free_pairing_code')
}

/** The event checks the organiser's code before the screen learns which event to show. */
export const claimWallPairingFor = async ({
  code,
  input,
  pairings,
  rooms
}: {
  code: WallPairingCode
  input: ClaimWallPairingInput
  pairings: WallPairings
  rooms: EventRooms
}): Promise<
  Result<
    void,
    'event_not_found' | 'not_found' | 'unknown_display' | 'wrong_code'
  >
> => {
  const vouched = await rooms.vouchForWall(input.eventId, {
    displayId: input.displayId,
    organiserCode: input.organiserCode
  })

  if (vouched.status === 'failure') {
    return vouched
  }

  return pairings.claim(code, {
    displayId: input.displayId,
    eventId: input.eventId
  })
}
