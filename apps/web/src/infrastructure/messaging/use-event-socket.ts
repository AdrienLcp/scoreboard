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

const RECONNECT_BASE_MS = 500
const RECONNECT_CEILING_MS = 8_000

const reconnectDelayFor = (attempt: number): number =>
  Math.min(RECONNECT_CEILING_MS, RECONNECT_BASE_MS * 2 ** (attempt - 1))

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
  const socketRef = useRef<WebSocket | null>(null)

  const forwardMessage = useEffectEvent(onMessage)
  const announceOpen = useEffectEvent(
    (send: (message: ClientMessage) => void) => onOpen?.(send)
  )

  useEffect(() => {
    if (credentials === null) {
      setStatus('closed')

      return
    }

    let isDisposed = false
    let hasGivenUp = false
    let attempt = 0
    let reconnectTimer: number | undefined

    const connect = (): void => {
      const socket = new WebSocket(
        `${socketOrigin()}${fillRoute(EVENT_SOCKET_ROUTE, { eventId })}`
      )

      socketRef.current = socket
      setStatus('connecting')

      const sendOnSocket = (message: ClientMessage): void => {
        socket.send(encodeMessage(message))
      }

      socket.addEventListener('open', () => {
        attempt = 0
        setStatus('open')
        setError(null)
        sendOnSocket({
          credentials,
          protocolVersion: PROTOCOL_VERSION,
          type: 'hello'
        })
        announceOpen(sendOnSocket)
      })

      socket.addEventListener('message', (event) => {
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
          }

          return
        }

        forwardMessage(decoded.message)
      })

      socket.addEventListener('close', () => {
        setStatus(hasGivenUp ? 'refused' : 'closed')

        if (isDisposed || hasGivenUp) {
          return
        }

        attempt += 1
        reconnectTimer = window.setTimeout(connect, reconnectDelayFor(attempt))
      })
    }

    connect()

    return () => {
      isDisposed = true
      window.clearTimeout(reconnectTimer)
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [credentials, eventId])

  const send = (message: ClientMessage): boolean => {
    const socket = socketRef.current

    if (socket === null || socket.readyState !== WebSocket.OPEN) {
      return false
    }

    socket.send(encodeMessage(message))

    return true
  }

  return { error, send, status }
}
