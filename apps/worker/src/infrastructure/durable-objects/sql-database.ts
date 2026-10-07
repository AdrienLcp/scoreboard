export type SqlBinding = string | number | null

export type SqlRow = Readonly<Record<string, unknown>>

/**
 * The synchronous SQL a store runs on: a Durable Object's SQLite storage in
 * production, `node:sqlite` in the tests. One statement per `run`.
 */
export type SqlDatabase = {
  run: (statement: string, ...bindings: SqlBinding[]) => SqlRow[]
  transaction: <TResult>(work: () => TResult) => TResult
}
