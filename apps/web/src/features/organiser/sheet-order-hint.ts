import type { TableNumber } from '@scoreboard/protocol/identifiers'

import type { EncounterFormat } from '@scoreboard/core/encounter/encounter-format'

import { useClubTranslate } from '@/features/club/use-club-translate'

/** "A–X on table 3, B–Y on table 4": the sheet's order under an encounter's letters. */
export const useSheetOrderHint = ({
  format,
  tables
}: {
  format: EncounterFormat
  tables: readonly TableNumber[]
}): string => {
  const translate = useClubTranslate()
  const tableOf = (group: number) => {
    const table = tables.at(group)

    return table === undefined
      ? translate(
          group === 0
            ? 'organiser.encountersStep.theFirstTable'
            : 'organiser.encountersStep.theSecondTable'
        )
      : translate('organiser.encountersStep.theTable', { table })
  }
  const openingOf = (group: number) => {
    const opening = format.sheet.find(
      (sheetLine) =>
        sheetLine.group === group + 1 && sheetLine.kind === 'singles'
    )

    return opening?.kind === 'singles' ? `${opening.home}–${opening.away}` : ''
  }

  return format.groupCount === 1
    ? translate('organiser.encountersStep.orderOneTable', {
        count: format.sheet.length,
        first: openingOf(0)
      })
    : translate('organiser.encountersStep.orderTwoTables', {
        count: format.sheet.length,
        first: openingOf(0),
        firstTable: tableOf(0),
        second: openingOf(1),
        secondTable: tableOf(1)
      })
}
