import { createI18n } from '@adrienlcp/i18n'

import { FR_DICTIONARY } from '@/presentation/i18n/dictionary-fr'
import { FR_SPECTATOR_DICTIONARY } from '@/presentation/i18n/dictionary-fr-spectator'
import { featureTranslator } from '@/presentation/i18n/feature-translator'
import { DEFAULT_LOCALE } from '@/presentation/i18n/regional-locales'

const spectatorI18n = createI18n({
  defaultLocale: DEFAULT_LOCALE,
  dictionaries: { fr: { ...FR_DICTIONARY, ...FR_SPECTATOR_DICTIONARY } }
})

export const useSpectatorTranslate = featureTranslator(spectatorI18n)
