import { DurableObject } from 'cloudflare:workers'
import type { Result } from '@adrienlcp/result'

import { encodeChecked } from '@scoreboard/protocol/codec'
import type { OrganiserCode } from '@scoreboard/protocol/identifiers'
import type { CreateEventInput } from '@scoreboard/protocol/routes'
import {
  type ServerMessage,
  serverMessageSchema
} from '@scoreboard/protocol/server-message'

import { type Admission, admissionSchema } from '@/domain/event/admission'
import { openEvent } from '@/domain/event/event-service'
import { handleFrame } from '@/domain/event/event-session'
import type { EventStore } from '@/domain/event/event-store'
import { snapshotMessageFor } from '@/domain/event/event-view'
import type { Env } from '@/env'
import { nowMs } from '@/infrastructure/clock'
import { cryptoRandomIndex } from '@/infrastructure/random'

import { createSqlEventStore } from './sql-event-store'

const POLICY_VIOLATION = 1008

const admissionOf = (socket: WebSocket): Admission | null => {
  const parsed = admissionSchema.safeParse(socket.deserializeAttachment())

  return parsed.success ? parsed.data : null
}

const send = (socket: WebSocket, message: ServerMessage): void => {
  socket.send(encodeChecked(serverMessageSchema, message))
}

/**
 * One event: its setup, its scores and every screen watching it. Sockets go
 * through the hibernation API, so an idle hall costs nothing between points.
 */
export class EventRoom extends DurableObject<Env> {
  private readonly store: EventStore

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.store = createSqlEventStore(ctx.storage.sql)
  }

  open(
    input: CreateEventInput,
    organiserCode: OrganiserCode
  ): Result<void, 'already_open'> {
    return openEvent({
      input,
      organiserCode,
      randomIndex: cryptoRandomIndex,
      store: this.store
    })
  }

  override fetch(request: Request): Response {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected a WebSocket', { status: 426 })
    }

    const { 0: client, 1: server } = new WebSocketPair()

    this.ctx.acceptWebSocket(server)

    return new Response(null, { status: 101, webSocket: client })
  }

  override webSocketMessage(
    socket: WebSocket,
    message: string | ArrayBuffer
  ): void {
    if (typeof message !== 'string') {
      return
    }

    const outcome = handleFrame({
      admission: admissionOf(socket),
      nowMs: nowMs(),
      randomIndex: cryptoRandomIndex,
      raw: message,
      store: this.store
    })

    socket.serializeAttachment(outcome.admission)

    for (const reply of outcome.replies) {
      send(socket, reply)
    }

    if (outcome.shouldClose) {
      socket.close(POLICY_VIOLATION, 'refused')

      return
    }

    if (outcome.isEventChanged) {
      this.broadcastSnapshots()
    }
  }

  private broadcastSnapshots(): void {
    const snapshotsByAdmission = new Map<string, ServerMessage | null>()
    const broadcastAtMs = nowMs()

    for (const socket of this.ctx.getWebSockets()) {
      const admission = admissionOf(socket)

      if (admission === null) {
        continue
      }

      const key = JSON.stringify(admission)
      const snapshot = snapshotsByAdmission.has(key)
        ? (snapshotsByAdmission.get(key) ?? null)
        : snapshotMessageFor({
            admission,
            nowMs: broadcastAtMs,
            store: this.store
          })

      snapshotsByAdmission.set(key, snapshot)

      if (snapshot !== null) {
        send(socket, snapshot)
      }
    }
  }
}
