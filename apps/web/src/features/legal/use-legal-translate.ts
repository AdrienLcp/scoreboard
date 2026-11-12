import { createI18n } from '@adrienlcp/i18n'

import { FR_DICTIONARY } from '@/presentation/i18n/dictionary-fr'
import { FR_LEGAL_DICTIONARY } from '@/presentation/i18n/dictionary-fr-legal'
import { featureTranslator } from '@/presentation/i18n/feature-translator'
import { DEFAULT_LOCALE } from '@/presentation/i18n/regional-locales'

export const useLegalTranslate = featureTranslator(
  createI18n({
    defaultLocale: DEFAULT_LOCALE,
    dictionaries: { fr: { ...FR_DICTIONARY, ...FR_LEGAL_DICTIONARY } }
  })
)
