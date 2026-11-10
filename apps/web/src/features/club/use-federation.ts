import { useEffect, useEffectEvent, useSyncExternalStore } from 'react'

import { FEDERATION_BROWSER_CACHE_SECONDS } from '@scoreboard/protocol/federation'

import type { FederationError } from '@/infrastructure/api/federation-api'
import { nowMs } from '@/infrastructure/clock'

export type FederationState<TData> =
  | { data: TData; status: 'ready' }
  | { status: 'loading' }
  | { status: FederationError }

type Entry<TData> = { loadedAtMs: number; state: FederationState<TData> }

/** What the FFTT answered is kept in memory no longer than a browser may keep it: its terms of use allow 24 hours in all, the worker's cache holding the rest. */
const KEEP_MS = FEDERATION_BROWSER_CACHE_SECONDS * 1000

const LOADING = { status: 'loading' } as const

/**
 * One of the federation's routes as a hook: each answer shared by every
 * component asking the same arguments, `null` while there is nothing to ask.
 * A failed answer is asked again the next time a component mounts.
 */
export const federationQuery = <TArgs, TData extends object>({
  keyOf,
  load
}: {
  keyOf: (args: TArgs) => string
  load: (
    args: TArgs
  ) => Promise<
    | { data: TData; status: 'success' }
    | { error: FederationError; status: 'failure' }
  >
}) => {
  const entries = new Map<string, Entry<TData>>()
  const listeners = new Set<() => void>()

  const subscribe = (listener: () => void) => {
    listeners.add(listener)

    return () => listeners.delete(listener)
  }

  const settle = (key: string, state: FederationState<TData>) => {
    entries.set(key, { loadedAtMs: nowMs(), state })

    for (const listener of listeners) {
      listener()
    }
  }

  const isStale = (entry: Entry<TData> | undefined) =>
    entry === undefined ||
    (entry.state.status !== 'loading' &&
      (entry.state.status !== 'ready' || nowMs() - entry.loadedAtMs > KEEP_MS))

  return (args: TArgs | null): FederationState<TData> | null => {
    const key = args === null ? null : keyOf(args)
    const state = useSyncExternalStore(subscribe, () =>
      key === null ? null : (entries.get(key)?.state ?? LOADING)
    )
    const ask = useEffectEvent((asked: string) => {
      if (args === null || !isStale(entries.get(asked))) {
        return
      }

      settle(asked, LOADING)
      void load(args).then((result) =>
        settle(
          asked,
          result.status === 'success'
            ? { data: result.data, status: 'ready' }
            : { status: result.error }
        )
      )
    })

    useEffect(() => {
      if (key !== null) {
        ask(key)
      }
    }, [key])

    return state
  }
}
