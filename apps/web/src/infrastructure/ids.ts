/** A fresh id for anything this device creates: a player, a match, a scoring event. */
export const newId = (): string => crypto.randomUUID()
