import { z } from 'zod'

import { eventSetupSchema } from '@scoreboard/protocol/event-setup'
import { tableAccessSchema } from '@scoreboard/protocol/event-snapshot'
import {
  type MatchId,
  matchIdSchema,
  organiserCodeSchema
} from '@scoreboard/protocol/identifiers'
import {
  instantMsSchema,
  type StampedEvent,
  scoringEventSchema
} from '@scoreboard/protocol/scoring-event'

import type { EventStore } from '@/domain/event/event-store'

const SCHEMA_STATEMENTS = [
  'CREATE TABLE IF NOT EXISTS event_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS scoring_events (sequence INTEGER PRIMARY KEY AUTOINCREMENT, match_id TEXT NOT NULL, recorded_at_ms INTEGER NOT NULL, body TEXT NOT NULL)'
]

const META_KEYS = {
  organiserCode: 'organiser_code',
  setup: 'setup',
  tableAccesses: 'table_accesses'
} as const

const metaRowSchema = z.object({ value: z.string() })
const eventRowSchema = z.object({
  body: z.string(),
  match_id: matchIdSchema,
  recorded_at_ms: instantMsSchema
})

/**
 * Parses what this store wrote itself. A row that no longer matches its schema
 * is a bug in a past write, not an input to recover from.
 */
const parseStored = <TValue>(schema: z.ZodType<TValue>, json: string): TValue =>
  schema.parse(JSON.parse(json))

/** The event's `EventStore` over its Durable Object's SQLite storage. */
export const createSqlEventStore = (sql: SqlStorage): EventStore => {
  for (const statement of SCHEMA_STATEMENTS) {
    sql.exec(statement)
  }

  const readMeta = <TValue>(
    key: string,
    schema: z.ZodType<TValue>
  ): TValue | null => {
    const row = sql
      .exec('SELECT value FROM event_meta WHERE key = ?', key)
      .toArray()
      .at(0)

    return row === undefined
      ? null
      : parseStored(schema, metaRowSchema.parse(row).value)
  }

  const writeMeta = (key: string, value: unknown): void => {
    sql.exec(
      'INSERT INTO event_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      key,
      JSON.stringify(value)
    )
  }

  return {
    appendScoringEvent: (matchId, { event, recordedAtMs }) => {
      sql.exec(
        'INSERT INTO scoring_events (match_id, recorded_at_ms, body) VALUES (?, ?, ?)',
        matchId,
        recordedAtMs,
        JSON.stringify(event)
      )
    },
    readLogs: () => {
      const logs = new Map<MatchId, StampedEvent[]>()

      for (const row of sql
        .exec(
          'SELECT match_id, recorded_at_ms, body FROM scoring_events ORDER BY sequence'
        )
        .toArray()) {
        const stored = eventRowSchema.parse(row)
        const log = logs.get(stored.match_id) ?? []

        log.push({
          event: parseStored(scoringEventSchema, stored.body),
          recordedAtMs: stored.recorded_at_ms
        })
        logs.set(stored.match_id, log)
      }

      return logs
    },
    readOrganiserCode: () =>
      readMeta(META_KEYS.organiserCode, organiserCodeSchema),
    readSetup: () => readMeta(META_KEYS.setup, eventSetupSchema),
    readTableAccesses: () =>
      readMeta(META_KEYS.tableAccesses, z.array(tableAccessSchema)) ?? [],
    writeOrganiserCode: (code) => {
      writeMeta(META_KEYS.organiserCode, code)
    },
    writeSetup: (setup) => {
      writeMeta(META_KEYS.setup, setup)
    },
    writeTableAccesses: (accesses) => {
      writeMeta(META_KEYS.tableAccesses, accesses)
    }
  }
}
