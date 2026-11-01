import { Result } from '@adrienlcp/result'
import {
  readStoredJson,
  type StorageReadError,
  type StorageWriteError,
  writeStoredJson
} from '@adrienlcp/safe-storage'
import { z } from 'zod'

import { type EventId, eventIdSchema } from '@scoreboard/protocol/identifiers'

export const ORGANISED_EVENTS_KEY = 'scoreboard:organised-events'

const MAX_REMEMBERED = 20

const organisedEventSchema = z.object({
  eventId: eventIdSchema,
  name: z.string()
})
export type OrganisedEvent = z.infer<typeof organisedEventSchema>

const organisedEventsSchema = z.array(organisedEventSchema).max(MAX_REMEMBERED)

const isOrganisedEvents = (value: unknown): value is OrganisedEvent[] =>
  organisedEventsSchema.safeParse(value).success

/** The events this device opened the organiser console of, latest first: a scanned screen asks which one it joins. */
export const readOrganisedEvents = (): Result<
  OrganisedEvent[],
  StorageReadError
> => {
  const stored = readStoredJson({
    isValue: isOrganisedEvents,
    key: ORGANISED_EVENTS_KEY
  })

  return stored.status === 'success'
    ? Result.success(stored.data ?? [])
    : stored
}

const others = (eventId: EventId): OrganisedEvent[] => {
  const stored = readOrganisedEvents()

  return stored.status === 'success'
    ? stored.data.filter((event) => event.eventId !== eventId)
    : []
}

export const rememberOrganisedEvent = (
  event: OrganisedEvent
): Result<void, StorageWriteError> =>
  writeStoredJson({
    key: ORGANISED_EVENTS_KEY,
    value: [event, ...others(event.eventId)].slice(0, MAX_REMEMBERED)
  })

export const forgetOrganisedEvent = (
  eventId: EventId
): Result<void, StorageWriteError> =>
  writeStoredJson({ key: ORGANISED_EVENTS_KEY, value: others(eventId) })
