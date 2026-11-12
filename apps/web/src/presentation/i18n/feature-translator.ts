import type { I18n, Translator } from '@adrienlcp/i18n'

import { preferredLanguages } from '@/infrastructure/browser'

import { DEFAULT_LOCALE, type Locale } from './regional-locales'

/**
 * The hook a feature reads its own strings through, from a registry holding
 * the shared dictionary and the sections only that feature shows: those ride
 * in the feature's chunk instead of in the first load of every page. The
 * locale is the provider's, so a second one would be chosen in one place.
 */
export const featureTranslator =
  <Reference>(
    featureI18n: I18n<Reference, Locale, typeof DEFAULT_LOCALE>
  ): (() => Translator<Reference>) =>
  () =>
    featureI18n.translator(DEFAULT_LOCALE, preferredLanguages())
