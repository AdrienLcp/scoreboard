/** Entries with their 1-based number, as a calendar counts its teams and rounds: the number is their identity. */
export const numbered = <Entry>(
  entries: readonly Entry[]
): { entry: Entry; number: number }[] =>
  entries.map((entry, index) => ({ entry, number: index + 1 }))
