import { Result } from '@adrienlcp/result'

import {
  type ClubCode,
  type ClubRecord,
  type CreateClubInput,
  type CreatedClub,
  clubRecordSchema,
  createdClubSchema
} from '@scoreboard/protocol/club-record'
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

const JSON_HEADERS = { 'Content-Type': 'application/json' }

/** Opens the club's store; the answer holds the code its devices keep. */
export const createClub = async (
  input: CreateClubInput
): Promise<Result<CreatedClub, ApiError>> => {
  try {
    const response = await fetch(API_ROUTES.clubs, {
      body: JSON.stringify(input),
      headers: JSON_HEADERS,
      method: 'POST'
    })
    const created = createdClubSchema.safeParse(
      response.ok ? await response.json() : null
    )

    return created.success
      ? Result.success(created.data)
      : Result.failure('refused')
  } catch {
    return Result.failure('network')
  }
}

/** The club's teams, licensees and opponents; `refused` when no club holds the code. */
export const readClub = async (
  clubCode: ClubCode
): Promise<Result<ClubRecord, ApiError>> => {
  try {
    const response = await fetch(fillRoute(API_ROUTES.club, { clubCode }))
    const record = clubRecordSchema.safeParse(
      response.ok ? await response.json() : null
    )

    return record.success
      ? Result.success(record.data)
      : Result.failure('refused')
  } catch {
    return Result.failure('network')
  }
}

export const saveClub = async ({
  clubCode,
  record
}: {
  clubCode: ClubCode
  record: ClubRecord
}): Promise<Result<void, ApiError>> => {
  try {
    const response = await fetch(fillRoute(API_ROUTES.club, { clubCode }), {
      body: JSON.stringify(record),
      headers: JSON_HEADERS,
      method: 'PUT'
    })

    return response.ok ? Result.success() : Result.failure('refused')
  } catch {
    return Result.failure('network')
  }
}
