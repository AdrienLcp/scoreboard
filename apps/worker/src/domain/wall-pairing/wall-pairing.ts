import { Result } from '@adrienlcp/result'

import type { PairedWall, WallPairingStatus } from '@scoreboard/protocol/routes'

/** Long enough to walk from the TV to the organiser's table and back; the screen draws a new code after. */
export const WALL_PAIRING_TTL_MS = 10 * 60 * 1000

export type WallPairingState =
  | { expiresAtMs: number; status: 'waiting' }
  | (PairedWall & { expiresAtMs: number; status: 'paired' })

const liveOrNull = (
  state: WallPairingState | null,
  nowMs: number
): WallPairingState | null =>
  state !== null && state.expiresAtMs > nowMs ? state : null

/** A drawn code that is still in use is refused, never taken over. */
export const openWallPairing = (
  state: WallPairingState | null,
  nowMs: number
): Result<WallPairingState, 'taken'> =>
  liveOrNull(state, nowMs) === null
    ? Result.success({
        expiresAtMs: nowMs + WALL_PAIRING_TTL_MS,
        status: 'waiting'
      })
    : Result.failure('taken')

/** A second claim before the screen collected the first one wins: the organiser changed their mind. */
export const claimWallPairing = ({
  nowMs,
  state,
  wall
}: {
  nowMs: number
  state: WallPairingState | null
  wall: PairedWall
}): Result<WallPairingState, 'not_found'> => {
  const live = liveOrNull(state, nowMs)

  return live === null
    ? Result.failure('not_found')
    : Result.success({
        ...wall,
        expiresAtMs: live.expiresAtMs,
        status: 'paired'
      })
}

/**
 * What the waiting screen hears when it asks. A pairing is collected once:
 * after the screen has heard its event, the code is free again.
 */
export const collectWallPairing = (
  state: WallPairingState | null,
  nowMs: number
): { next: WallPairingState | null; status: WallPairingStatus | null } => {
  const live = liveOrNull(state, nowMs)

  if (live === null) {
    return { next: null, status: null }
  }

  if (live.status === 'waiting') {
    return { next: live, status: { status: 'waiting' } }
  }

  return {
    next: null,
    status: {
      displayId: live.displayId,
      eventId: live.eventId,
      status: 'paired'
    }
  }
}
