import type { FailureResult } from '@adrienlcp/result'

/**
 * Reports a failure the app falls back from, so it stays visible in the
 * console without interrupting the person using the page.
 */
export const warnOnFailure = <E extends string>(
  outcome: FailureResult<E> | { status: 'success' },
  what: string
): void => {
  if (outcome.status === 'failure') {
    console.warn(`${what}: ${outcome.error}`)
  }
}
