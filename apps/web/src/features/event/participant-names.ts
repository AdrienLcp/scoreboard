import type { Participant, Player } from '@scoreboard/protocol/event-setup'

/** The names on one side of a match; empty while nobody is named for it. */
export const participantNames = (
  players: readonly Player[],
  participant: Participant
): string[] =>
  participant.playerIds.flatMap((playerId) => {
    const player = players.find((candidate) => candidate.id === playerId)

    return player === undefined ? [] : [player.name]
  })

const words = (name: string): string[] =>
  name
    .trim()
    .split(/\s+/)
    .filter((word) => word !== '')

/** "Thomas Rivière" reads "T. Rivière": the family name carries across a hall. */
export const shortName = (name: string): string => {
  const [first, ...rest] = words(name)

  if (first === undefined || rest.length === 0) {
    return name.trim()
  }

  return `${first.charAt(0)}. ${rest.join(' ')}`
}

const familyName = (name: string): string => words(name).at(-1) ?? name

const DOUBLES_SEPARATOR = ' / '

/**
 * One side's name, `null` while nobody is named: a singles player in full or
 * shortened, a doubles pair by family names in the short form.
 */
export const sideName = ({
  form,
  participant,
  players
}: {
  form: 'full' | 'short'
  participant: Participant
  players: readonly Player[]
}): string | null => {
  const names = participantNames(players, participant)
  const [only] = names

  if (only === undefined) {
    return null
  }

  if (form === 'full') {
    return names.join(DOUBLES_SEPARATOR)
  }

  return names.length === 1
    ? shortName(only)
    : names.map(familyName).join(DOUBLES_SEPARATOR)
}
