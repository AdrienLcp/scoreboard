import { describe, expect, it } from 'vitest'

import {
  createSmartpingClient,
  type Fetch,
  type ResponseCache
} from './smartping-client'
import { smartpingKeyOf } from './smartping-signature'
import { type SmartpingRequest, smartpingCacheKeyOf } from './smartping-url'

/** The spec's worked example: 14:00:22.081 in Paris on 2015-06-11. */
const SPEC_EXAMPLE_INSTANT_MS = 1_434_024_022_081

const CREDENTIALS = {
  appId: 'SX042',
  key: smartpingKeyOf('FFTT'),
  serial: 'ABCDEFGHIJ12345'
}

const REQUEST: SmartpingRequest = {
  endpoint: 'xml_licence_b',
  params: { club: '12850078', licence: '' }
}

const LIST = '<?xml version="1.0" encoding="ISO-8859-1"?><liste/>'

const memoryCache = () => {
  const entries = new Map<string, { body: string; maxAgeSeconds: number }>()
  const cache: ResponseCache = {
    read: async (key) => entries.get(key)?.body ?? null,
    write: async (key, body, maxAgeSeconds) => {
      entries.set(key, { body, maxAgeSeconds })
    }
  }

  return { cache, entries }
}

const answering = (status: number, body: string) => {
  const urls: string[] = []
  const fetch: Fetch = async (input) => {
    urls.push(input)

    return {
      arrayBuffer: () => new Response(body).arrayBuffer(),
      status
    }
  }

  return { fetch, urls }
}

const clientWith = (cache: ResponseCache, fetch: Fetch) =>
  createSmartpingClient({
    cache,
    credentials: CREDENTIALS,
    fetch,
    now: () => SPEC_EXAMPLE_INSTANT_MS
  })

describe('the Smartping client', () => {
  it('[smartping] keys the cache by the unsigned URL, its parameters sorted', () => {
    const unsorted: SmartpingRequest = {
      endpoint: 'xml_licence_b',
      params: Object.fromEntries([
        ['licence', ''],
        ['club', '12850078']
      ])
    }

    expect(smartpingCacheKeyOf(unsorted)).toBe(
      'https://apiv2.fftt.com/mobile/pxml/xml_licence_b.php?club=12850078&licence='
    )
  })

  it('[smartping] signs a call it does not hold, then keeps the answer for the age asked', async () => {
    const { cache, entries } = memoryCache()
    const { fetch, urls } = answering(200, LIST)

    const answer = await clientWith(cache, fetch).read(REQUEST, 86_400)

    expect(answer).toEqual({ data: LIST, status: 'success' })
    expect(urls).toEqual([
      'https://apiv2.fftt.com/mobile/pxml/xml_licence_b.php?club=12850078&licence=&id=SX042&serie=ABCDEFGHIJ12345&tm=20150611140022081&tmc=517b27013dd619db47f2bf4c50ae504acbb33980'
    ])
    expect(entries.get(smartpingCacheKeyOf(REQUEST))).toEqual({
      body: LIST,
      maxAgeSeconds: 86_400
    })
  })

  it('[smartping] answers from the cache without calling the FFTT', async () => {
    const { cache } = memoryCache()
    await cache.write(smartpingCacheKeyOf(REQUEST), LIST, 86_400)
    const { fetch, urls } = answering(500, '')

    const answer = await clientWith(cache, fetch).read(REQUEST, 86_400)

    expect(answer).toEqual({ data: LIST, status: 'success' })
    expect(urls).toEqual([])
  })

  it('[smartping] keeps neither a refused call nor an error body, and says the FFTT is unavailable', async () => {
    const refused = answering(401, '<erreur>Compte incorrect</erreur>')
    const errorBody = answering(
      200,
      '<?xml version="1.0"?><erreurs><code>400</code><erreur>Parametre manquant</erreur></erreurs>'
    )

    for (const { fetch } of [refused, errorBody]) {
      const { cache, entries } = memoryCache()

      expect(await clientWith(cache, fetch).read(REQUEST, 86_400)).toEqual({
        error: 'unavailable',
        status: 'failure'
      })
      expect(entries.size).toBe(0)
    }
  })

  it('[smartping] says the FFTT is unavailable when the network fails', async () => {
    const { cache } = memoryCache()
    const failing: Fetch = async () => {
      throw new TypeError('fetch failed')
    }

    expect(await clientWith(cache, failing).read(REQUEST, 60)).toEqual({
      error: 'unavailable',
      status: 'failure'
    })
  })
})
