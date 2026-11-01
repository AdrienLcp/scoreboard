import { Result } from '@adrienlcp/result'

import type { DisplayId, OrganiserCode } from '@scoreboard/protocol/identifiers'

import type { EventStore } from './event-store'

export type WallVouch = {
  displayId: DisplayId | null
  organiserCode: OrganiserCode
}

export type WallVouchRefusal =
  | 'event_not_found'
  | 'unknown_display'
  | 'wrong_code'

/** Only the organiser puts a screen on their event, and only on a display the event has. */
export const vouchForWall = (
  store: EventStore,
  { displayId, organiserCode }: WallVouch
): Result<void, WallVouchRefusal> => {
  const setup = store.readSetup()

  if (setup === null) {
    return Result.failure('event_not_found')
  }

  if (organiserCode !== store.readOrganiserCode()) {
    return Result.failure('wrong_code')
  }

  if (
    displayId !== null &&
    !setup.displays.some((display) => display.id === displayId)
  ) {
    return Result.failure('unknown_display')
  }

  return Result.success()
}
