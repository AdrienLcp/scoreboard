import { DatabaseSync } from 'node:sqlite'

import { describe, expect, it } from 'vitest'

import { EVENT_ROOM_MIGRATIONS } from './event-room-schema'
import { migrateSchema } from './schema-migrations'
import { openNodeSqlDatabase } from './testing/node-sql-database'

const storedVersion = (sqlite: DatabaseSync) =>
  sqlite.prepare('SELECT version FROM schema_version').all()

const tableNames = (sqlite: DatabaseSync) =>
  sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    .all()
    .map((row) => row.name)

describe('migrateSchema', () => {
  it('brings a new room to the last version', () => {
    const sqlite = new DatabaseSync(':memory:')

    migrateSchema(openNodeSqlDatabase(sqlite), EVENT_ROOM_MIGRATIONS)

    expect(storedVersion(sqlite)).toEqual([
      { version: EVENT_ROOM_MIGRATIONS.length }
    ])
    expect(tableNames(sqlite)).toEqual([
      'event_meta',
      'schema_version',
      'scoring_events'
    ])
  })

  it('runs nothing again on a room already at the last version', () => {
    const sqlite = new DatabaseSync(':memory:')
    const database = openNodeSqlDatabase(sqlite)
    migrateSchema(database, EVENT_ROOM_MIGRATIONS)
    sqlite
      .prepare('INSERT INTO event_meta (key, value) VALUES (?, ?)')
      .run('setup', '{}')

    migrateSchema(database, [
      ...EVENT_ROOM_MIGRATIONS,
      ['ALTER TABLE event_meta ADD COLUMN note TEXT']
    ])
    migrateSchema(database, [
      ...EVENT_ROOM_MIGRATIONS,
      ['ALTER TABLE event_meta ADD COLUMN note TEXT']
    ])

    expect(storedVersion(sqlite)).toEqual([
      { version: EVENT_ROOM_MIGRATIONS.length + 1 }
    ])
    expect(sqlite.prepare('SELECT key, note FROM event_meta').all()).toEqual([
      { key: 'setup', note: null }
    ])
  })

  it('keeps the rows of a room opened before the schema was versioned', () => {
    const sqlite = new DatabaseSync(':memory:')
    sqlite.exec(
      'CREATE TABLE event_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)'
    )
    sqlite.exec(
      'CREATE TABLE scoring_events (sequence INTEGER PRIMARY KEY AUTOINCREMENT, match_id TEXT NOT NULL, recorded_at_ms INTEGER NOT NULL, body TEXT NOT NULL)'
    )
    sqlite
      .prepare('INSERT INTO event_meta (key, value) VALUES (?, ?)')
      .run('organiser_code', '"PQRSTUVWXYZ2"')

    migrateSchema(openNodeSqlDatabase(sqlite), EVENT_ROOM_MIGRATIONS)

    expect(storedVersion(sqlite)).toEqual([
      { version: EVENT_ROOM_MIGRATIONS.length }
    ])
    expect(sqlite.prepare('SELECT key FROM event_meta').all()).toEqual([
      { key: 'organiser_code' }
    ])
  })

  it('leaves the schema as it was when a migration fails', () => {
    const sqlite = new DatabaseSync(':memory:')

    expect(() =>
      migrateSchema(openNodeSqlDatabase(sqlite), [
        ...EVENT_ROOM_MIGRATIONS,
        ['ALTER TABLE missing ADD COLUMN note TEXT']
      ])
    ).toThrow()
    expect(tableNames(sqlite)).toEqual([])
  })
})
