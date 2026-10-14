import type { ProtocolErrorMessage } from '@scoreboard/protocol/server-message'

/** The server holds nothing for this event any more: it was erased, or never opened. */
export const isEventGone = (error: ProtocolErrorMessage | null): boolean =>
  error?.code === 'event_deleted' || error?.code === 'event_not_found'
