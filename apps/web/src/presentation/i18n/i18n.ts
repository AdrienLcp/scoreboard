import { createI18n } from '@adrienlcp/i18n'

import { FR_DICTIONARY } from './dictionary-fr.ts'
import { DEFAULT_LOCALE } from './regional-locales.ts'

/** French is the reference: the app ships to French clubs first. */
export const i18n = createI18n({
  defaultLocale: DEFAULT_LOCALE,
  dictionaries: { fr: FR_DICTIONARY }
})
