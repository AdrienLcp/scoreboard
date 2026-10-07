import { EVENT_ROOM_MIGRATIONS } from '@/infrastructure/durable-objects/event-room-schema'
import { migrateSchema } from '@/infrastructure/durable-objects/schema-migrations'
import { openNodeSqlDatabase } from '@/infrastructure/durable-objects/testing/node-sql-database'

import { createEventStore, type EventStore } from '../event-store'

/** A fresh event store on `node:sqlite`, its schema migrated as the Durable Object's is. */
export const createNodeEventStore = (): EventStore => {
  const database = openNodeSqlDatabase()
  migrateSchema(database, EVENT_ROOM_MIGRATIONS)

  return createEventStore(database)
}
