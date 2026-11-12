import { createI18n } from '@adrienlcp/i18n'

import { FR_DICTIONARY } from '@/presentation/i18n/dictionary-fr'
import { FR_UMPIRE_DICTIONARY } from '@/presentation/i18n/dictionary-fr-umpire'
import { featureTranslator } from '@/presentation/i18n/feature-translator'
import { DEFAULT_LOCALE } from '@/presentation/i18n/regional-locales'

const umpireI18n = createI18n({
  defaultLocale: DEFAULT_LOCALE,
  dictionaries: { fr: { ...FR_DICTIONARY, ...FR_UMPIRE_DICTIONARY } }
})

export const useUmpireTranslate = featureTranslator(umpireI18n)
