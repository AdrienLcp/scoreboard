import { DatabaseSync } from 'node:sqlite'

import type { SqlDatabase } from '../sql-database'

/** A `SqlDatabase` over an in-memory `node:sqlite` database: the production SQL, run in Node. */
export const openNodeSqlDatabase = (
  sqlite: DatabaseSync = new DatabaseSync(':memory:')
): SqlDatabase => ({
  run: (statement, ...bindings) => sqlite.prepare(statement).all(...bindings),
  transaction: (work) => {
    sqlite.exec('BEGIN')

    try {
      const result = work()
      sqlite.exec('COMMIT')

      return result
    } catch (error) {
      sqlite.exec('ROLLBACK')
      throw error
    }
  }
})
