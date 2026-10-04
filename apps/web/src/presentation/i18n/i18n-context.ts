import { createSafeContext } from '@adrienlcp/react'

import type { Translate } from './translation'

type I18nContextValue = {
  translate: Translate
}

export const [I18nContext, useI18n] =
  createSafeContext<I18nContextValue>('I18nProvider')

export const useTranslate = (): Translate => useI18n().translate
