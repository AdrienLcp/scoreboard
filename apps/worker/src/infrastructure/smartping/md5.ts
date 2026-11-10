/** Per-round left rotations, four per round of sixteen steps. */
const ROTATIONS = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21]

const SINE_CONSTANTS = Array.from(
  { length: 64 },
  (_, step) => Math.floor(Math.abs(Math.sin(step + 1)) * 2 ** 32) >>> 0
)

const BLOCK_BYTES = 64

/** The message, a 1 bit, zeros, and its bit length on the last 8 bytes, to a whole number of blocks. */
const paddedBytesOf = (bytes: Uint8Array): DataView => {
  const length = Math.ceil((bytes.length + 9) / BLOCK_BYTES) * BLOCK_BYTES
  const padded = new Uint8Array(length)
  padded.set(bytes)
  padded[bytes.length] = 0x80
  const view = new DataView(padded.buffer)
  const bitLength = bytes.length * 8
  view.setUint32(length - 8, bitLength >>> 0, true)
  view.setUint32(length - 4, Math.floor(bitLength / 2 ** 32), true)

  return view
}

const mixOf = (step: number, b: number, c: number, d: number) => {
  if (step < 16) {
    return { index: step, mixed: (b & c) | (~b & d) }
  }

  if (step < 32) {
    return { index: (5 * step + 1) % 16, mixed: (d & b) | (~d & c) }
  }

  if (step < 48) {
    return { index: (3 * step + 5) % 16, mixed: b ^ c ^ d }
  }

  return { index: (7 * step) % 16, mixed: c ^ (b | ~d) }
}

const littleEndianHexOf = (word: number) =>
  [0, 8, 16, 24]
    .map((shift) => ((word >>> shift) & 0xff).toString(16).padStart(2, '0'))
    .join('')

/**
 * The lowercase hex MD5 of a text's UTF-8 bytes. Smartping keys its
 * signature with the MD5 of the FFTT password; Workers hash MD5 natively but
 * Node, where the tests and the init script run, does not, so one pure
 * implementation serves both.
 */
export const md5Hex = (text: string): string => {
  const view = paddedBytesOf(new TextEncoder().encode(text))
  const state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476]

  for (let offset = 0; offset < view.byteLength; offset += BLOCK_BYTES) {
    let [a = 0, b = 0, c = 0, d = 0] = state

    for (let step = 0; step < 64; step++) {
      const { index, mixed } = mixOf(step, b, c, d)
      const sum =
        (a +
          mixed +
          (SINE_CONSTANTS[step] ?? 0) +
          view.getUint32(offset + index * 4, true)) |
        0
      const rotation = ROTATIONS[(step >> 4) * 4 + (step % 4)] ?? 0
      a = d
      d = c
      c = b
      b = (b + ((sum << rotation) | (sum >>> (32 - rotation)))) | 0
    }

    state[0] = ((state[0] ?? 0) + a) | 0
    state[1] = ((state[1] ?? 0) + b) | 0
    state[2] = ((state[2] ?? 0) + c) | 0
    state[3] = ((state[3] ?? 0) + d) | 0
  }

  return state.map(littleEndianHexOf).join('')
}
