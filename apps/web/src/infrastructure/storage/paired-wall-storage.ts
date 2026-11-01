import type { Result } from '@adrienlcp/result'
import {
  readStoredJson,
  removeStored,
  type StorageReadError,
  type StorageWriteError,
  writeStoredJson
} from '@adrienlcp/safe-storage'

import type { DisplayId, EventId } from '@scoreboard/protocol/identifiers'
import { type PairedWall, pairedWallSchema } from '@scoreboard/protocol/routes'

export const PAIRED_WALL_KEY = 'scoreboard:paired-wall'

const isPairedWall = (value: unknown): value is PairedWall =>
  pairedWallSchema.safeParse(value).success

/** The display this TV was put on: `/wall` goes straight back to it. */
export const readPairedWall = (): Result<PairedWall | null, StorageReadError> =>
  readStoredJson({ isValue: isPairedWall, key: PAIRED_WALL_KEY })

export const rememberPairedWall = (
  wall: PairedWall
): Result<void, StorageWriteError> =>
  writeStoredJson({ key: PAIRED_WALL_KEY, value: wall })

export const forgetPairedWall = (): Result<void, StorageWriteError> =>
  removeStored(PAIRED_WALL_KEY)

/** Whether this device is the TV paired to that display, rather than a laptop that opened its link. */
export const isPairedWallOf = ({
  displayId,
  eventId
}: {
  displayId: DisplayId | null
  eventId: EventId
}): boolean => {
  const stored = readPairedWall()

  return (
    stored.status === 'success' &&
    stored.data !== null &&
    stored.data.eventId === eventId &&
    stored.data.displayId === displayId
  )
}
