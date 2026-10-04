/** A predictable stand-in for a random index: 0, 1, 2… wrapped to the size asked. */
export const countingIndex = () => {
  let next = 0
  return (size: number): number => {
    const index = next % size
    next += 1
    return index
  }
}
