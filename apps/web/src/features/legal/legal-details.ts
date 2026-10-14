/** Who publishes the site and how to reach them: a private individual, named, with a contact page. */
export const PUBLISHER = {
  contactHref: 'https://adrienlcp.com/fr/contact',
  name: 'Adrien Lacourpaille'
} as const

export const HOST = {
  addressLines: ['101 Townsend St', 'San Francisco, CA 94107', 'USA'],
  name: 'Cloudflare, Inc.'
} as const

/** The longest the measurement's raw records are kept, the CNIL's ceiling. */
export const MEASUREMENT_RETENTION_MONTHS = 25

/** How long Cloudflare keeps the worker's request logs on the free plan. */
export const REQUEST_LOG_RETENTION_DAYS = 3

export const CNIL_COMPLAINT_HREF = 'https://www.cnil.fr/fr/plaintes'
