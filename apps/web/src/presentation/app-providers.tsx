import type React from 'react'

import { I18nProvider } from '@/presentation/i18n/i18n-provider'

type AppProvidersProps = {
  children: React.ReactNode
}

/** Everything above the router. */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => (
  <I18nProvider>{children}</I18nProvider>
)
