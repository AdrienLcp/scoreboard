import type { ResponseCache } from './smartping-client'

/**
 * The data centre's cache, keyed by the unsigned request URL. It lets an
 * entry go once its `max-age` runs out, and never holds one longer: nothing
 * of the federation's is written to a Durable Object.
 */
export const workersResponseCache = (cache: Cache): ResponseCache => ({
  read: async (key) => {
    const hit = await cache.match(key)

    return hit === undefined ? null : hit.text()
  },
  write: async (key, body, maxAgeSeconds) => {
    await cache.put(
      key,
      new Response(body, {
        headers: {
          'Cache-Control': `public, max-age=${maxAgeSeconds}`,
          'Content-Type': 'application/xml; charset=utf-8'
        }
      })
    )
  }
})
