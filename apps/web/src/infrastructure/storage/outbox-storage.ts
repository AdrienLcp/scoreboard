import type { Result } from '@adrienlcp/result'
import {
  readStoredJson,
  type StorageReadError,
  type StorageWriteError,
  writeStoredJson
} from '@adrienlcp/safe-storage'
import { z } from 'zod'

import { recordMessageSchema } from '@scoreboard/protocol/client-message'
import type { EventId, UmpireCode } from '@scoreboard/protocol/identifiers'

import type { Outbox } from '@/infrastructure/messaging/outbox'

const outboxSchema = z.array(recordMessageSchema.omit({ type: true }))

const isOutbox = (value: unknown): value is Outbox =>
  outboxSchema.safeParse(value).success

const keyFor = ({
  code,
  eventId
}: {
  code: UmpireCode
  eventId: EventId
}): string => `scoreboard:outbox:${eventId}:${code}`

/**
 * The points this console scored and the server has not confirmed yet. Kept
 * on the device, so a reload in a dead spot of the hall loses none of them.
 */
export const readOutbox = (seat: {
  code: UmpireCode
  eventId: EventId
}): Result<Outbox | null, StorageReadError> =>
  readStoredJson({ isValue: isOutbox, key: keyFor(seat) })

export const writeOutbox = ({
  outbox,
  ...seat
}: {
  code: UmpireCode
  eventId: EventId
  outbox: Outbox
}): Result<void, StorageWriteError> =>
  writeStoredJson({ key: keyFor(seat), value: outbox })
