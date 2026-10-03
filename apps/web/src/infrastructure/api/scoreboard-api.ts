import { Result } from '@adrienlcp/result'

import {
  API_ROUTES,
  type CreatedEvent,
  type CreateEventInput,
  createdEventSchema
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
