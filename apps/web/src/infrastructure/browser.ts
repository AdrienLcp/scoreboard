/**
 * The socket shares the page's origin: in dev the Vite proxy forwards `/ws` to
 * the worker, in production the worker serves both.
 */
export const socketOrigin = (): string =>
  `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`

/** The origin a link handed to another device starts with, like a table's QR code. */
export const pageOrigin = (): string => location.origin

/** The reader's languages in order of preference, which numbers and numeric dates take their shape from. */
export const preferredLanguages = (): readonly string[] => navigator.languages
