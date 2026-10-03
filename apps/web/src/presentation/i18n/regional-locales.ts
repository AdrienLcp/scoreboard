/** The app's locales, by the regional tag react-aria keeps strings for. Imported by `vite.config.ts`. */
export const REGIONAL_LOCALES = {
  fr: 'fr-FR'
} as const

export type Locale = keyof typeof REGIONAL_LOCALES

export const DEFAULT_LOCALE: Locale = 'fr'
