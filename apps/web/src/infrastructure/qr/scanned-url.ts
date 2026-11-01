/**
 * A link written in capitals fits QR alphanumeric mode, a smaller code that
 * scans from further away. Hosts ignore case, and every page reads its
 * parameters case-insensitively.
 */
export const scannedUrlOf = (url: string): string => url.toUpperCase()
