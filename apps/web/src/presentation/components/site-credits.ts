/** The author every page credits in its footer, linked to his site in French, the app's only language. */
export const AUTHOR = {
  name: 'Adrien Lacourpaille',
  siteHref: 'https://adrienlcp.com/fr'
} as const

/**
 * The project's public repository, linked from the footer; `null` once the
 * source turns private, and the footer links none.
 */
export const SOURCE_REPOSITORY_HREF: string | null =
  'https://github.com/AdrienLcp/scoreboard'
