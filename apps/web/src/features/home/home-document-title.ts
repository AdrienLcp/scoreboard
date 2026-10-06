import type { Translate } from '@/presentation/i18n/translation'

/** The home page's title, in the tab and in search results alike. */
export const homeDocumentTitle = (translate: Translate): string =>
  `${translate('app.name')} — ${translate('home.headline')}`
