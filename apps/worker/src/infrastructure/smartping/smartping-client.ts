import { Result } from '@adrienlcp/result'

import type { InstantMs } from '@scoreboard/protocol/scoring-event'

import {
  type SmartpingCredentials,
  type SmartpingEndpoint,
  type SmartpingRequest,
  signedSmartpingUrlOf,
  smartpingCacheKeyOf
} from './smartping-url'
import { decodeSmartpingBytes, isSmartpingErrorBody } from './smartping-xml'

/** A call that has not answered by then is given up: the route answers the FFTT unavailable. */
const SMARTPING_TIMEOUT_MS = 10_000

/** Where answers are kept between calls, for no longer than the terms of use allow. */
export type ResponseCache = {
  read: (key: string) => Promise<string | null>
  write: (key: string, body: string, maxAgeSeconds: number) => Promise<void>
}

export type Fetch = (
  input: string,
  init: { signal: AbortSignal }
) => Promise<Pick<Response, 'arrayBuffer' | 'status'>>

export type SmartpingClient = {
  /** The call's text, from the cache when it holds it, else from the FFTT, kept `maxAgeSeconds` at most. */
  read: (
    request: SmartpingRequest,
    maxAgeSeconds: number
  ) => Promise<Result<string, 'unavailable'>>
}

/** Logs carry the endpoint and the status, never the parameters (a name searched) nor the signature. */
const logFailure = (endpoint: SmartpingEndpoint, reason: string) => {
  console.error({ endpoint, message: 'Smartping call failed', reason })
}

export const createSmartpingClient = ({
  cache,
  credentials,
  fetch,
  now
}: {
  cache: ResponseCache
  credentials: SmartpingCredentials
  fetch: Fetch
  now: () => InstantMs
}): SmartpingClient => ({
  read: async (request, maxAgeSeconds) => {
    const key = smartpingCacheKeyOf(request)
    const cached = await cache.read(key)

    if (cached !== null) {
      return Result.success(cached)
    }

    let response: Pick<Response, 'arrayBuffer' | 'status'>

    try {
      response = await fetch(
        await signedSmartpingUrlOf(request, credentials, now()),
        { signal: AbortSignal.timeout(SMARTPING_TIMEOUT_MS) }
      )
    } catch {
      logFailure(request.endpoint, 'network')

      return Result.failure('unavailable')
    }

    if (response.status !== 200) {
      logFailure(request.endpoint, `status ${response.status}`)

      return Result.failure('unavailable')
    }

    const body = decodeSmartpingBytes(
      new Uint8Array(await response.arrayBuffer())
    )

    if (isSmartpingErrorBody(body)) {
      logFailure(request.endpoint, 'error body')

      return Result.failure('unavailable')
    }

    await cache.write(key, body, maxAgeSeconds)

    return Result.success(body)
  }
})
