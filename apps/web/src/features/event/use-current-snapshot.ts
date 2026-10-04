import type { PublicSnapshot } from '@scoreboard/protocol/event-snapshot'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'

import { withStartsEstimatedAt } from '@scoreboard/core/event/public-snapshot'

import { useServerNow } from './use-server-now'

/** Expected starts move by whole steps: a label that changed every second would read as noise. */
const ESTIMATE_STEP_MS = 30_000

/**
 * The last snapshot as it stands now: the server's time ticking on this
 * device, and the expected starts worked out again every 30 seconds, so they
 * keep moving while nobody scores instead of slipping into the past.
 */
export const useCurrentSnapshot = (
  snapshot: PublicSnapshot | null
): { nowMs: InstantMs; snapshot: PublicSnapshot | null } => {
  const nowMs = useServerNow(snapshot?.generatedAtMs ?? null)

  if (snapshot === null) {
    return { nowMs, snapshot }
  }

  const estimatedAtMs = Math.max(
    snapshot.generatedAtMs,
    nowMs - (nowMs % ESTIMATE_STEP_MS)
  )

  return {
    nowMs,
    snapshot: withStartsEstimatedAt(snapshot, estimatedAtMs)
  }
}
