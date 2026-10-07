import { DurableObject } from 'cloudflare:workers'
import type { Result } from '@adrienlcp/result'
import { Hono } from 'hono'

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
import { createEventStore, type EventStore } from '@/domain/event/event-store'
import { snapshotMessageFor } from '@/domain/event/event-view'
import { nowMs } from '@/infrastructure/clock'
import { drawSecureCode } from '@/infrastructure/ids'

import { EVENT_ROOM_MIGRATIONS } from './event-room-schema'
import { migrateSchema } from './schema-migrations'
import type { SqlDatabase } from './sql-database'

const POLICY_VIOLATION = 1008

const sqlDatabaseOf = (storage: DurableObjectStorage): SqlDatabase => ({
  run: (statement, ...bindings) =>
    storage.sql.exec(statement, ...bindings).toArray(),
  transaction: (work) => storage.transactionSync(work)
})

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
  private readonly app = new Hono().get('*', (context) => {
    if (context.req.header('Upgrade') !== 'websocket') {
      return context.text('Expected a WebSocket', 426)
    }

    const { 0: client, 1: server } = new WebSocketPair()

    this.ctx.acceptWebSocket(server)

    return new Response(null, { status: 101, webSocket: client })
  })

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    const database = sqlDatabaseOf(ctx.storage)
    migrateSchema(database, EVENT_ROOM_MIGRATIONS)
    this.store = createEventStore(database)
  }

  open(
    input: CreateEventInput,
    organiserCode: OrganiserCode
  ): Result<void, 'already_open'> {
    return openEvent({
      drawCode: drawSecureCode,
      input,
      organiserCode,
      store: this.store
    })
  }

  override fetch(request: Request): Response | Promise<Response> {
    return this.app.fetch(request)
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
      drawCode: drawSecureCode,
      nowMs: nowMs(),
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
