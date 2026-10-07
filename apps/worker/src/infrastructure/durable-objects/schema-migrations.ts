import { z } from 'zod'

import type { SqlDatabase } from './sql-database'

/** One schema version: the statements that lead to it from the previous one. A deployed entry is never edited. */
export type SchemaMigration = readonly string[]

const versionRowSchema = z.object({ version: z.number().int().nonnegative() })

const readVersion = (database: SqlDatabase): number => {
  const row = database.run('SELECT version FROM schema_version').at(0)

  return row === undefined ? 0 : versionRowSchema.parse(row).version
}

/** Brings the schema to the last version, from the one stored, in one transaction. */
export const migrateSchema = (
  database: SqlDatabase,
  migrations: readonly SchemaMigration[]
): void => {
  database.transaction(() => {
    database.run(
      'CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)'
    )
    const storedVersion = readVersion(database)

    if (storedVersion >= migrations.length) {
      return
    }

    for (const migration of migrations.slice(storedVersion)) {
      for (const statement of migration) {
        database.run(statement)
      }
    }

    database.run('DELETE FROM schema_version')
    database.run(
      'INSERT INTO schema_version (version) VALUES (?)',
      migrations.length
    )
  })
}
