import { createI18n } from '@adrienlcp/i18n'

import { FR_DICTIONARY } from '@/presentation/i18n/dictionary-fr'
import { FR_CLUB_DICTIONARY } from '@/presentation/i18n/dictionary-fr-club'
import { featureTranslator } from '@/presentation/i18n/feature-translator'
import { DEFAULT_LOCALE } from '@/presentation/i18n/regional-locales'

/** The shared `club` section keeps what a first visit shows, so both halves are merged. */
const clubI18n = createI18n({
  defaultLocale: DEFAULT_LOCALE,
  dictionaries: {
    fr: {
      ...FR_DICTIONARY,
      ...FR_CLUB_DICTIONARY,
      club: { ...FR_DICTIONARY.club, ...FR_CLUB_DICTIONARY.club }
    }
  }
})

/** The organiser's and the club's strings: its page, its home, its season and its events. */
export const useClubTranslate = featureTranslator(clubI18n)

export type ClubTranslate = ReturnType<typeof useClubTranslate>
