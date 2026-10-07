import type { Result } from '@adrienlcp/result'

import type { EventId, OrganiserCode } from '@scoreboard/protocol/identifiers'
import type { CreateEventInput } from '@scoreboard/protocol/routes'

/** The events' Durable Objects, one per event id, as the front door reaches them. */
export type EventRooms = {
  connect: (eventId: EventId, request: Request) => Promise<Response>
  open: (
    eventId: EventId,
    input: CreateEventInput,
    organiserCode: OrganiserCode
  ) => Promise<Result<void, 'already_open'>>
}
