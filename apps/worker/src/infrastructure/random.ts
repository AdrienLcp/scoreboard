import type { RandomIndex } from '@scoreboard/core/access/access-codes'

const UINT32_RANGE = 2 ** 32

/** A uniform index from the platform's cryptographic source, without modulo bias. */
export const cryptoRandomIndex: RandomIndex = (size) => {
  const unbiasedLimit = UINT32_RANGE - (UINT32_RANGE % size)
  const draw = new Uint32Array(1)

  do {
    crypto.getRandomValues(draw)
  } while ((draw[0] ?? 0) >= unbiasedLimit)

  return (draw[0] ?? 0) % size
}
