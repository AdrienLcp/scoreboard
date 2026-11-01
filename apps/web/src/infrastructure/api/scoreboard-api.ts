import { Result } from '@adrienlcp/result'

import type { WallPairingCode } from '@scoreboard/protocol/identifiers'
import {
  API_ROUTES,
  apiErrorResponseSchema,
  type ClaimWallPairingInput,
  type CreatedEvent,
  type CreateEventInput,
  createdEventSchema,
  fillRoute,
  type OpenedWallPairing,
  openedWallPairingSchema,
  type WallPairingStatus,
  wallPairingStatusSchema
} from '@scoreboard/protocol/routes'

export type ApiError = 'network' | 'refused'

/** Opens a new event; the answer holds the organiser's code, shown once. */
export const createEvent = async (
  input: CreateEventInput
): Promise<Result<CreatedEvent, ApiError>> => {
  try {
    const response = await fetch(API_ROUTES.events, {
      body: JSON.stringify(input),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST'
    })

    if (!response.ok) {
      return Result.failure('refused')
    }

    const created = createdEventSchema.safeParse(await response.json())

    return created.success
      ? Result.success(created.data)
      : Result.failure('refused')
  } catch {
    return Result.failure('network')
  }
}

/** A screen draws the code it shows while it waits for its event. */
export const openWallPairing = async (): Promise<
  Result<OpenedWallPairing, ApiError>
> => {
  try {
    const response = await fetch(API_ROUTES.wallPairings, { method: 'POST' })
    const opened = openedWallPairingSchema.safeParse(
      response.ok ? await response.json() : null
    )

    return opened.success
      ? Result.success(opened.data)
      : Result.failure('refused')
  } catch {
    return Result.failure('network')
  }
}

/** `expired` once nobody claimed the code in time: the screen draws another. */
export const readWallPairing = async (
  pairingCode: WallPairingCode
): Promise<Result<WallPairingStatus, ApiError | 'expired'>> => {
  try {
    const response = await fetch(
      fillRoute(API_ROUTES.wallPairing, { pairingCode }),
      { cache: 'no-store' }
    )

    if (response.status === 404) {
      return Result.failure('expired')
    }

    const status = wallPairingStatusSchema.safeParse(
      response.ok ? await response.json() : null
    )

    return status.success
      ? Result.success(status.data)
      : Result.failure('refused')
  } catch {
    return Result.failure('network')
  }
}

export type ClaimWallError =
  | 'expired'
  | 'network'
  | 'refused'
  | 'unknown_display'
  | 'wrong_code'

export const claimWallPairing = async (
  pairingCode: WallPairingCode,
  input: ClaimWallPairingInput
): Promise<Result<void, ClaimWallError>> => {
  try {
    const response = await fetch(
      fillRoute(API_ROUTES.wallPairingClaim, { pairingCode }),
      {
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST'
      }
    )

    if (response.ok) {
      return Result.success()
    }

    if (response.status === 404) {
      return Result.failure('expired')
    }

    const refusal = apiErrorResponseSchema.safeParse(await response.json())
    const code = refusal.success ? refusal.data.code : null

    return Result.failure(
      code === 'wrong_code' || code === 'unknown_display' ? code : 'refused'
    )
  } catch {
    return Result.failure('network')
  }
}
