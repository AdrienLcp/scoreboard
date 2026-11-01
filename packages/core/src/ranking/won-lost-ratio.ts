/** won / lost, where nothing lost beats any ratio and nothing at all counts as even. */
export const wonLostRatio = (won: number, lost: number): number =>
  lost === 0 ? (won === 0 ? 1 : Number.POSITIVE_INFINITY) : won / lost
