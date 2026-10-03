import { Result } from '@adrienlcp/result'
import { encode } from 'uqr'

/** Rows of modules, `true` for a dark one, with no quiet zone: the drawing adds it. */
export type QrModules = readonly (readonly boolean[])[]

/**
 * The QR code for a link, at medium error correction so a glare spot on a TV
 * or a crease in a printed sheet still scans. The only module that knows
 * which library draws the code.
 */
export const qrModulesFor = (text: string): Result<QrModules, 'too_long'> => {
  try {
    return Result.success(encode(text, { border: 0, ecc: 'M' }).data)
  } catch {
    return Result.failure('too_long')
  }
}
