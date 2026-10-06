import ReconnectingWebSocket from 'partysocket/ws'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

import type {
  ClientMessage,
  Credentials
} from '@scoreboard/protocol/client-message'
import { decodeMessage, encodeMessage } from '@scoreboard/protocol/codec'
import type { EventId } from '@scoreboard/protocol/identifiers'
import { EVENT_SOCKET_ROUTE, fillRoute } from '@scoreboard/protocol/routes'
import {
  type ProtocolErrorMessage,
  type ServerMessage,
  serverMessageSchema
} from '@scoreboard/protocol/server-message'
import { PROTOCOL_VERSION } from '@scoreboard/protocol/version'

import { socketOrigin } from '@/infrastructure/browser'

/**
 * `closed` is still counting down to another attempt; `refused` is the server
 * having said why and the client having stopped.
 */
export type SocketStatus = 'connecting' | 'open' | 'closed' | 'refused'

export type EventSocket = {
  error: ProtocolErrorMessage | null
  /** `false` when the frame could not be written: the socket is down. */
  send: (message: ClientMessage) => boolean
  status: SocketStatus
}

const RECONNECT_FLOOR_MS = 500
const RECONNECT_SPREAD_MS = 1_000
const RECONNECT_CEILING_MS = 8_000

/** Each device waits its own first delay, so a hall whose Wi-Fi comes back does not reconnect in one burst. */
const reconnectFloorMs = (): number =>
  RECONNECT_FLOOR_MS + Math.random() * RECONNECT_SPREAD_MS

/**
 * Owns the event's socket: the hello, the reconnect policy and decoding. The
 * only module in the app that touches `WebSocket`.
 */
export const useEventSocket = ({
  credentials,
  eventId,
  onMessage,
  onOpen
}: {
  /** Kept stable by the caller: new credentials open a new socket. */
  credentials: Credentials | null
  eventId: EventId
  onMessage: (message: ServerMessage) => void
  /** Runs right after the hello, so frames it sends reach the server admitted. */
  onOpen?: (send: (message: ClientMessage) => void) => void
}): EventSocket => {
  const [status, setStatus] = useState<SocketStatus>('connecting')
  const [error, setError] = useState<ProtocolErrorMessage | null>(null)
  const socketRef = useRef<ReconnectingWebSocket | null>(null)

  const forwardMessage = useEffectEvent(onMessage)
  const announceOpen = useEffectEvent(
    (send: (message: ClientMessage) => void) => onOpen?.(send)
  )

  useEffect(() => {
    if (credentials === null) {
      setStatus('closed')

      return
    }

    const socket = new ReconnectingWebSocket(
      `${socketOrigin()}${fillRoute(EVENT_SOCKET_ROUTE, { eventId })}`,
      undefined,
      {
        maxEnqueuedMessages: 0,
        maxReconnectionDelay: RECONNECT_CEILING_MS,
        minReconnectionDelay: reconnectFloorMs()
      }
    )
    const listening = new AbortController()
    let hasGivenUp = false

    socketRef.current = socket
    setStatus('connecting')

    const sendOnSocket = (message: ClientMessage): void => {
      socket.send(encodeMessage(message))
    }

    socket.addEventListener(
      'open',
      () => {
        setStatus('open')
        setError(null)
        sendOnSocket({
          credentials,
          protocolVersion: PROTOCOL_VERSION,
          type: 'hello'
        })
        announceOpen(sendOnSocket)
      },
      { signal: listening.signal }
    )

    socket.addEventListener(
      'message',
      (event) => {
        if (typeof event.data !== 'string') {
          return
        }

        const decoded = decodeMessage(serverMessageSchema, event.data)

        if (decoded.status === 'failure') {
          return
        }

        if (decoded.message.type === 'error') {
          setError(decoded.message)

          if (decoded.message.fatal) {
            hasGivenUp = true
            setStatus('refused')
            socket.close()
          }

          return
        }

        forwardMessage(decoded.message)
      },
      { signal: listening.signal }
    )

    socket.addEventListener(
      'close',
      () => {
        setStatus(hasGivenUp ? 'refused' : 'closed')
      },
      { signal: listening.signal }
    )

    return () => {
      listening.abort()
      socket.close()
      socketRef.current = null
    }
  }, [credentials, eventId])

  const send = (message: ClientMessage): boolean => {
    const socket = socketRef.current

    if (socket === null || socket.readyState !== socket.OPEN) {
      return false
    }

    socket.send(encodeMessage(message))

    return true
  }

  return { error, send, status }
}
