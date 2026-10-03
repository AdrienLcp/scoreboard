import type { Result } from '@adrienlcp/result'
import {
  readRecognizedText,
  type StorageReadError,
  type StorageWriteError,
  writeStoredText
} from '@adrienlcp/safe-storage'

import {
  type EventId,
  type OrganiserCode,
  organiserCodeSchema
} from '@scoreboard/protocol/identifiers'

const keyFor = (eventId: EventId): string => `scoreboard:organiser:${eventId}`

const isOrganiserCode = (stored: string): stored is OrganiserCode =>
  organiserCodeSchema.safeParse(stored).success

/** The organiser code this device was handed for the event, if any. */
export const readOrganiserCode = (
  eventId: EventId
): Result<OrganiserCode | null, StorageReadError> =>
  readRecognizedText({ isRecognized: isOrganiserCode, key: keyFor(eventId) })

export const writeOrganiserCode = ({
  code,
  eventId
}: {
  code: OrganiserCode
  eventId: EventId
}): Result<void, StorageWriteError> =>
  writeStoredText({ key: keyFor(eventId), text: code })
