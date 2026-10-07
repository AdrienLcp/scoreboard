import { z } from 'zod'

import {
  type EventSetup,
  eventSetupSchema
} from '@scoreboard/protocol/event-setup'
import {
  type TableAccess,
  tableAccessSchema
} from '@scoreboard/protocol/event-snapshot'
import {
  type MatchId,
  matchIdSchema,
  type OrganiserCode,
  organiserCodeSchema
} from '@scoreboard/protocol/identifiers'
import {
  instantMsSchema,
  type StampedEvent,
  scoringEventSchema
} from '@scoreboard/protocol/scoring-event'

import type { MatchLogs } from '@scoreboard/core/event/public-snapshot'

import type { SqlDatabase } from '@/infrastructure/durable-objects/sql-database'

/** What the event's Durable Object keeps. Synchronous: the object's SQLite storage is. */
export type EventStore = {
  appendScoringEvent: (matchId: MatchId, stamped: StampedEvent) => void
  readLogs: () => MatchLogs
  readOrganiserCode: () => OrganiserCode | null
  readSetup: () => EventSetup | null
  readTableAccesses: () => TableAccess[]
  writeOrganiserCode: (code: OrganiserCode) => void
  writeSetup: (setup: EventSetup) => void
  writeTableAccesses: (accesses: readonly TableAccess[]) => void
}

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

/** The event's store over its SQL database, whose schema is already migrated. */
export const createEventStore = (database: SqlDatabase): EventStore => {
  const readMeta = <TValue>(
    key: string,
    schema: z.ZodType<TValue>
  ): TValue | null => {
    const row = database
      .run('SELECT value FROM event_meta WHERE key = ?', key)
      .at(0)

    return row === undefined
      ? null
      : parseStored(schema, metaRowSchema.parse(row).value)
  }

  const writeMeta = (key: string, value: unknown): void => {
    database.run(
      'INSERT INTO event_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      key,
      JSON.stringify(value)
    )
  }

  return {
    appendScoringEvent: (matchId, { event, recordedAtMs }) => {
      database.run(
        'INSERT INTO scoring_events (match_id, recorded_at_ms, body) VALUES (?, ?, ?)',
        matchId,
        recordedAtMs,
        JSON.stringify(event)
      )
    },
    readLogs: () => {
      const logs = new Map<MatchId, StampedEvent[]>()

      for (const row of database.run(
        'SELECT match_id, recorded_at_ms, body FROM scoring_events ORDER BY sequence'
      )) {
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
