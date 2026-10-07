import type { SchemaMigration } from './schema-migrations'

/** The event room's schema, version by version. */
export const EVENT_ROOM_MIGRATIONS: readonly SchemaMigration[] = [
  // Rooms opened before the schema was versioned already hold these tables, at version 0.
  [
    'CREATE TABLE IF NOT EXISTS event_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
    'CREATE TABLE IF NOT EXISTS scoring_events (sequence INTEGER PRIMARY KEY AUTOINCREMENT, match_id TEXT NOT NULL, recorded_at_ms INTEGER NOT NULL, body TEXT NOT NULL)'
  ]
]
