import type { DrawCode } from '../access/access-codes'

/** A predictable stand-in for a random code: the alphabet read in order, 0, 1, 2… wrapped to its length. */
export const countingCode = (): DrawCode => {
  let next = 0

  return (alphabet, length) =>
    Array.from({ length }, () => {
      const character = alphabet[next % alphabet.length] ?? ''
      next += 1
      return character
    }).join('')
}
