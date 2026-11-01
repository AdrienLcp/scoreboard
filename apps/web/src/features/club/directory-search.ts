import type { DirectoryPlayer } from '@scoreboard/protocol/club-record'

import { compareFrench } from '@/presentation/i18n/compare-french'

/** The longest name the club's store keeps, for a player, a team or a club. */
export const NAME_MAX_LENGTH = 80

const DIACRITICS = /\p{Diacritic}/gu
const WORD_BREAKS = /[\s'’-]+/

/** A name's words as a search reads them: lower case, accents set aside, "Jean-Pierre" as two words. */
const wordsOf = (text: string): string[] =>
  text
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .split(WORD_BREAKS)
    .filter((word) => word !== '')

/**
 * Every typed word starts a word of the name, in any order: "dup j" finds
 * "Jean Dupont", "lena" finds "Léna", as the federation's sheet software suggests from the first letters.
 */
export const matchesTyped = (name: string, typed: string): boolean => {
  const nameWords = wordsOf(name)

  return wordsOf(typed).every((typedWord) =>
    nameWords.some((word) => word.startsWith(typedWord))
  )
}

/** The same name once case, accents and spacing are set aside. */
export const isSameName = (one: string, other: string): boolean =>
  wordsOf(one).join(' ') === wordsOf(other).join(' ')

const hasLetters = (word: string): boolean =>
  word.toLocaleUpperCase('fr') !== word.toLocaleLowerCase('fr')

const isInCapitals = (word: string): boolean =>
  word.length > 1 && hasLetters(word) && word === word.toLocaleUpperCase('fr')

export type TypedName = { firstName: string; lastName: string }

/**
 * A typed "Jean Dupont", or "DUPONT Jean" as the sheet writes it: the words in
 * capitals are the family name, otherwise the first word is the first name.
 * `null` for a single word, which cannot be both, or a name too long to keep.
 */
export const splitTypedName = (typed: string): TypedName | null => {
  const words = typed.trim().split(/\s+/)

  if (words.length < 2) {
    return null
  }

  const capitals = words.filter(isInCapitals)
  const [first = '', ...rest] = words
  const name =
    capitals.length > 0 && capitals.length < words.length
      ? {
          firstName: words.filter((word) => !isInCapitals(word)).join(' '),
          lastName: capitals.join(' ')
        }
      : { firstName: first, lastName: rest.join(' ') }

  return name.firstName.length > NAME_MAX_LENGTH ||
    name.lastName.length > NAME_MAX_LENGTH
    ? null
    : name
}

/** "Rivals 4" is a team of the club Rivals; a name without a number is its club's own. */
export const clubNameOfTeam = (teamName: string): string =>
  teamName.trim().replace(/\s+\d+$/, '') || teamName.trim()

type Played = { lastPlayedOn?: string | undefined }

/** Most recently played first, never played last; ISO dates sort as text. */
export const byLastPlayed = (one: Played, other: Played): number =>
  (other.lastPlayedOn ?? '').localeCompare(one.lastPlayedOn ?? '')

/** Most recently played first, then in French alphabetical order of `name`. */
export const byRecentThenName =
  <T>(read: (entry: T) => Played & { name: string }) =>
  (one: T, other: T): number => {
    const first = read(one)
    const second = read(other)

    return byLastPlayed(first, second) || compareFrench(first.name, second.name)
  }

/** A licensee as the pickers sort him: family name first, with the day he last played. */
export const familyFirst = (player: DirectoryPlayer) => ({
  lastPlayedOn: player.lastPlayedOn,
  name: `${player.lastName} ${player.firstName}`
})

/** The latest of several days, the most recent one an entry was played. */
export const latestPlayed = (entries: readonly Played[]): string | undefined =>
  entries
    .map((entry) => entry.lastPlayedOn)
    .filter((day): day is string => day !== undefined)
    .toSorted()
    .at(-1)
