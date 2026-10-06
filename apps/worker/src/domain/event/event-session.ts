import { clientMessageSchema } from '@scoreboard/protocol/client-message'
import { decodeMessage } from '@scoreboard/protocol/codec'
import type { ProtocolErrorCode } from '@scoreboard/protocol/error-code'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'
import type { ServerMessage } from '@scoreboard/protocol/server-message'
import { PROTOCOL_VERSION } from '@scoreboard/protocol/version'

import type { DrawCode } from '@scoreboard/core/access/access-codes'

import type { Admission } from './admission'
import { admit, recordEvent, saveSetup } from './event-service'
import type { EventStore } from './event-store'
import { snapshotMessageFor } from './event-view'

/** What one frame did: what to answer, and whether every screen needs a fresh snapshot. */
export type FrameOutcome = {
  admission: Admission | null
  /** Every admitted socket gets a fresh snapshot of its role. */
  isEventChanged: boolean
  replies: ServerMessage[]
  /** A fatal error was answered: the socket is closed after the replies. */
  shouldClose: boolean
}

const ERROR_LOG_MESSAGE = {
  event_not_found: 'No event behind this address',
  hello_expected: 'The first frame must be a hello',
  internal_error: 'Unexpected failure',
  invalid_message: 'Frame does not match the protocol',
  invalid_setup: 'Setup refused',
  not_allowed: 'This role cannot do that',
  protocol_version_mismatch: 'Client and server protocol versions differ',
  wrong_code: 'No table or organiser holds this code'
} as const satisfies Record<ProtocolErrorCode, string>

const refused = (
  admission: Admission | null,
  code: ProtocolErrorCode,
  { isFatal }: { isFatal: boolean }
): FrameOutcome => ({
  admission,
  isEventChanged: false,
  replies: [
    { code, fatal: isFatal, message: ERROR_LOG_MESSAGE[code], type: 'error' }
  ],
  shouldClose: isFatal
})

const answered = (
  admission: Admission | null,
  replies: ServerMessage[],
  isEventChanged = false
): FrameOutcome => ({ admission, isEventChanged, replies, shouldClose: false })

/** Handles one inbound frame from a socket, given who that socket already is. */
export const handleFrame = ({
  admission,
  nowMs,
  drawCode,
  raw,
  store
}: {
  admission: Admission | null
  /** The server's clock as the frame arrived. */
  nowMs: InstantMs
  drawCode: DrawCode
  raw: string
  store: EventStore
}): FrameOutcome => {
  const decoded = decodeMessage(clientMessageSchema, raw)

  if (decoded.status === 'failure') {
    return refused(admission, 'invalid_message', { isFatal: false })
  }

  const { message } = decoded

  if (admission === null) {
    if (message.type !== 'hello') {
      return refused(null, 'hello_expected', { isFatal: true })
    }

    if (message.protocolVersion !== PROTOCOL_VERSION) {
      return refused(null, 'protocol_version_mismatch', { isFatal: true })
    }

    const admitted = admit(store, message.credentials)

    if (admitted.status === 'failure') {
      return refused(null, admitted.error, { isFatal: true })
    }

    const snapshot = snapshotMessageFor({
      admission: admitted.data,
      nowMs,
      store
    })

    return answered(admitted.data, snapshot === null ? [] : [snapshot])
  }

  switch (message.type) {
    case 'hello':
      return answered(admission, [])
    case 'match.record': {
      const recorded = recordEvent({
        admission,
        event: message.event,
        matchId: message.matchId,
        nowMs,
        store
      })

      if (recorded.status === 'success') {
        return answered(
          admission,
          [{ eventId: message.event.id, type: 'record.accepted' }],
          recorded.data === 'recorded'
        )
      }

      if (recorded.error === 'not_allowed') {
        return refused(admission, 'not_allowed', { isFatal: false })
      }

      return answered(admission, [
        {
          eventId: message.event.id,
          reason: recorded.error,
          type: 'record.refused'
        }
      ])
    }
    case 'setup.save': {
      const saved = saveSetup({
        admission,
        drawCode,
        setup: message.setup,
        store
      })

      if (saved.status === 'success') {
        return answered(admission, [], true)
      }

      if (saved.error === 'not_allowed') {
        return refused(admission, 'not_allowed', { isFatal: false })
      }

      return answered(admission, [
        { reason: saved.error, type: 'setup.refused' }
      ])
    }
  }
}
