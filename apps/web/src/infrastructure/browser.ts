import { Result } from '@adrienlcp/result'

/**
 * The socket shares the page's origin: in dev the Vite proxy forwards `/ws` to
 * the worker, in production the worker serves both.
 */
export const socketOrigin = (): string =>
  `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`

/** The origin a link handed to another device starts with, like a table's QR code. */
export const pageOrigin = (): string => location.origin

/** Asked at the moment a script would move something, so a change of setting applies at once. */
export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Puts a link on the clipboard, for an organiser handing it on by message. */
export const copyText = async (
  text: string
): Promise<Result<void, 'refused'>> => {
  try {
    await navigator.clipboard.writeText(text)

    return Result.success()
  } catch {
    return Result.failure('refused')
  }
}
