import type { Result } from '@adrienlcp/result'
import {
  readStoredJson,
  type StorageReadError,
  type StorageWriteError,
  writeStoredJson
} from '@adrienlcp/safe-storage'
import { z } from 'zod'

import {
  type EventId,
  type PlayerId,
  playerIdSchema
} from '@scoreboard/protocol/identifiers'

const followedSchema = z.array(playerIdSchema).max(50)

const isFollowed = (value: unknown): value is PlayerId[] =>
  followedSchema.safeParse(value).success

const keyFor = (eventId: EventId): string => `scoreboard:followed:${eventId}`

/** The players a visitor pinned on this device for the event, kept across visits. */
export const readFollowedPlayers = (
  eventId: EventId
): Result<PlayerId[] | null, StorageReadError> =>
  readStoredJson({ isValue: isFollowed, key: keyFor(eventId) })

export const writeFollowedPlayers = ({
  eventId,
  playerIds
}: {
  eventId: EventId
  playerIds: readonly PlayerId[]
}): Result<void, StorageWriteError> =>
  writeStoredJson({ key: keyFor(eventId), value: playerIds })
