import type React from 'react'
import { I18nProvider as ReactAriaI18nProvider } from 'react-aria-components'

import { i18n } from './i18n'
import { I18nContext } from './i18n-context'
import { DEFAULT_LOCALE, REGIONAL_LOCALES } from './regional-locales'

type I18nProviderProps = {
  children: React.ReactNode
}

/** One locale for now; the provider is where a second one would be chosen. */
export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => (
  <I18nContext value={{ translate: i18n.translator(DEFAULT_LOCALE) }}>
    <ReactAriaI18nProvider locale={REGIONAL_LOCALES[DEFAULT_LOCALE]}>
      {children}
    </ReactAriaI18nProvider>
  </I18nContext>
)
