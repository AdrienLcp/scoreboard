import type { ClubRecord } from '@scoreboard/protocol/club-record'

import { useTranslate } from '@/presentation/i18n/i18n-context'

import { DEFAULT_TABLE_COUNT, defaultSavedPlanOf } from './club-day'

/** The name of the plan a new event starts from, as the club page names it: "Salle à 8 tables" when it has none. */
export const useDefaultPlanName = (record: ClubRecord | null): string => {
  const translate = useTranslate()
  const saved = record === null ? null : defaultSavedPlanOf(record)

  return (
    saved?.name ??
    translate('organiser.plan.hallOf', {
      count: saved?.plan.tables.length ?? DEFAULT_TABLE_COUNT
    })
  )
}
