import type { HtmlTagDescriptor, Plugin } from 'vite'

import { PAGE_ROUTES } from '../../packages/protocol/src/page-routes'
import { SITE_ORIGIN } from '../../packages/protocol/src/site'
import { homeDocumentTitle } from './src/features/home/home-document-title'
import { i18n } from './src/presentation/i18n/i18n'
import {
  DEFAULT_LOCALE,
  REGIONAL_LOCALES
} from './src/presentation/i18n/regional-locales'

const HOME_URL = new URL(PAGE_ROUTES.home, SITE_ORIGIN).href

/** Event pages are private to their event: the home page is the only one listed. */
const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${HOME_URL}</loc></url>
</urlset>
`

const ROBOTS = `User-agent: *
Allow: /

Sitemap: ${new URL('/sitemap.xml', SITE_ORIGIN).href}
`

const meta = (attrs: Record<string, string>): HtmlTagDescriptor => ({
  attrs,
  injectTo: 'head',
  tag: 'meta'
})

const headTags = (): HtmlTagDescriptor[] => {
  const translate = i18n.translator(DEFAULT_LOCALE)
  const siteName = translate('app.name')
  const title = homeDocumentTitle(translate)
  const description = translate('home.lead')

  return [
    { children: title, injectTo: 'head', tag: 'title' },
    meta({ content: description, name: 'description' }),
    {
      attrs: { href: HOME_URL, rel: 'canonical' },
      injectTo: 'head',
      tag: 'link'
    },
    meta({ content: 'website', property: 'og:type' }),
    meta({ content: siteName, property: 'og:site_name' }),
    meta({ content: title, property: 'og:title' }),
    meta({ content: description, property: 'og:description' }),
    meta({ content: HOME_URL, property: 'og:url' }),
    meta({
      content: REGIONAL_LOCALES[DEFAULT_LOCALE].replace('-', '_'),
      property: 'og:locale'
    }),
    meta({ content: 'summary', name: 'twitter:card' }),
    meta({ content: title, name: 'twitter:title' }),
    meta({ content: description, name: 'twitter:description' })
  ]
}

/**
 * Writes what search engines and link previews read into the one document the
 * app serves, from the home page's own copy, and emits robots.txt and the sitemap.
 */
export const searchEnginePlugin = (): Plugin => ({
  generateBundle() {
    this.emitFile({ fileName: 'robots.txt', source: ROBOTS, type: 'asset' })
    this.emitFile({ fileName: 'sitemap.xml', source: SITEMAP, type: 'asset' })
  },
  name: 'search-engine',
  transformIndexHtml: () => headTags()
})
