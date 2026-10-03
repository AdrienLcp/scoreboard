import type { TableNumber } from '@scoreboard/protocol/identifiers'

import type { Translate } from '@/presentation/i18n/translation'

const isRun = (tables: readonly TableNumber[]): boolean =>
  tables.every((table, position) => table === (tables[0] ?? 0) + position)

/** A screen's share of the tables: "tables 7 à 12" for a run, a list otherwise. */
export const tableScopeOf = (
  translate: Translate,
  tables: readonly TableNumber[]
): string => {
  const first = tables[0]
  const last = tables.at(-1)

  if (
    first !== undefined &&
    last !== undefined &&
    first !== last &&
    isRun(tables)
  ) {
    return translate('display.tableRun', { first, last })
  }

  return translate('encounter.tables', {
    count: tables.length,
    tables: tables.map(String)
  })
}
