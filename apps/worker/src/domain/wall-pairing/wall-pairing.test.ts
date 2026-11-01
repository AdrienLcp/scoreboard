import { describe, expect, it } from 'vitest'

import {
  claimWallPairing,
  collectWallPairing,
  openWallPairing,
  WALL_PAIRING_TTL_MS,
  type WallPairingState
} from './wall-pairing'

const OPENED_AT_MS = 1_000
const EXPIRES_AT_MS = OPENED_AT_MS + WALL_PAIRING_TTL_MS
const WALL = { displayId: null, eventId: 'match2team' }

const waiting: WallPairingState = {
  expiresAtMs: EXPIRES_AT_MS,
  status: 'waiting'
}

describe('openWallPairing', () => {
  it('[pairing] opens a fresh code for ten minutes', () => {
    expect(openWallPairing(null, OPENED_AT_MS)).toEqual({
      data: waiting,
      status: 'success'
    })
  })

  it('[pairing] refuses a code another screen still waits on', () => {
    expect(openWallPairing(waiting, OPENED_AT_MS + 1).status).toBe('failure')
  })

  it('[pairing] reuses a code once it has expired', () => {
    expect(openWallPairing(waiting, EXPIRES_AT_MS).status).toBe('success')
  })
})

describe('claimWallPairing', () => {
  it('[pairing] tells the waiting screen its event', () => {
    expect(
      claimWallPairing({ nowMs: OPENED_AT_MS, state: waiting, wall: WALL })
    ).toEqual({
      data: { ...WALL, expiresAtMs: EXPIRES_AT_MS, status: 'paired' },
      status: 'success'
    })
  })

  it('[pairing] refuses an expired code', () => {
    expect(
      claimWallPairing({ nowMs: EXPIRES_AT_MS, state: waiting, wall: WALL })
        .status
    ).toBe('failure')
  })

  it('[pairing] refuses a code no screen drew', () => {
    expect(
      claimWallPairing({ nowMs: OPENED_AT_MS, state: null, wall: WALL }).status
    ).toBe('failure')
  })
})

describe('collectWallPairing', () => {
  it('[pairing] keeps a screen waiting until it is claimed', () => {
    expect(collectWallPairing(waiting, OPENED_AT_MS)).toEqual({
      next: waiting,
      status: { status: 'waiting' }
    })
  })

  it('[pairing] hands the event over once, then frees the code', () => {
    const paired = claimWallPairing({
      nowMs: OPENED_AT_MS,
      state: waiting,
      wall: WALL
    })

    if (paired.status === 'failure') {
      throw new Error('claim refused')
    }

    expect(collectWallPairing(paired.data, OPENED_AT_MS)).toEqual({
      next: null,
      status: { ...WALL, status: 'paired' }
    })
  })

  it('[pairing] answers nothing once the code has expired', () => {
    expect(collectWallPairing(waiting, EXPIRES_AT_MS)).toEqual({
      next: null,
      status: null
    })
  })
})
