import type { DirectoryPlayer } from '@scoreboard/protocol/club-record'
import type {
  Encounter,
  EventSetup,
  MatchSetup,
  Player
} from '@scoreboard/protocol/event-setup'
import type {
  MatchId,
  PlayerId,
  TeamId
} from '@scoreboard/protocol/identifiers'
import type { Side } from '@scoreboard/protocol/side'

import { encounterFormatFor } from '@scoreboard/core/encounter/encounter-formats'
import { sheetLettersOf } from '@scoreboard/core/encounter/encounter-sheet'

/** A side's letters in the order of its sheet: A to F at home, X to T away. */
export const sideLettersOf = (
  encounter: Encounter,
  side: Side
): readonly string[] => {
  const format = encounterFormatFor(encounter.formatId)

  return side === 'home' ? format.homeLetters : format.awayLetters
}

const letterOf = (match: MatchSetup, side: Side): string | undefined =>
  sheetLettersOf(match.label)?.[side]

/**
 * Who holds each letter of a side today, read off the encounter's singles
 * lines: the latest line of a letter wins, since a line already played keeps
 * the player it was played by.
 */
export const encounterLineupOf = ({
  encounter,
  setup,
  side
}: {
  encounter: Encounter
  setup: EventSetup
  side: Side
}): (PlayerId | null)[] => {
  const lines = setup.matches.filter(
    (match) => match.encounterId === encounter.id
  )

  return sideLettersOf(encounter, side).map(
    (letter) =>
      lines.findLast(
        (match) =>
          letterOf(match, side) === letter && match[side].playerIds.length > 0
      )?.[side].playerIds[0] ?? null
  )
}

/** A player of the club's directory as the day's setup knows him, on his team. */
export const eventPlayerFrom = (
  player: DirectoryPlayer,
  teamId: TeamId
): Player => ({
  id: player.id,
  licence: player.licence,
  name: `${player.firstName} ${player.lastName}`,
  points: player.points,
  teamId
})

/**
 * Seats a side's lineup on every singles line of the encounter not yet
 * started, letter by letter; a seated player new to the day joins it. A line
 * already under way or played keeps its players.
 */
export const withEncounterLineup = ({
  encounter,
  lineup,
  newPlayers,
  setup,
  side,
  startedMatchIds
}: {
  encounter: Encounter
  lineup: readonly (PlayerId | null)[]
  newPlayers: readonly Player[]
  setup: EventSetup
  side: Side
  startedMatchIds: ReadonlySet<MatchId>
}): EventSetup => {
  const letters = sideLettersOf(encounter, side)
  const known = new Set(setup.players.map((player) => player.id))
  const seated = new Set(lineup)
  const joining = newPlayers.filter(
    (player, index) =>
      seated.has(player.id) &&
      !known.has(player.id) &&
      newPlayers.findIndex((other) => other.id === player.id) === index
  )

  return {
    ...setup,
    matches: setup.matches.map((match) => {
      const letter = letterOf(match, side)

      if (
        match.encounterId !== encounter.id ||
        startedMatchIds.has(match.id) ||
        letter === undefined
      ) {
        return match
      }

      const playerId = lineup.at(letters.indexOf(letter)) ?? null
      const participant = { playerIds: playerId === null ? [] : [playerId] }

      return side === 'home'
        ? { ...match, home: participant }
        : { ...match, away: participant }
    }),
    players: [...setup.players, ...joining]
  }
}

/** How many letters of a lineup someone holds. */
export const seatedCountOf = (lineup: readonly (PlayerId | null)[]): number =>
  lineup.filter((playerId) => playerId !== null).length

/** A lineup with a player on a letter, who leaves the one he held; `null` empties it. */
export const seatLetter = ({
  index,
  lineup,
  playerId
}: {
  index: number
  lineup: readonly (PlayerId | null)[]
  playerId: PlayerId | null
}): (PlayerId | null)[] =>
  Array.from({ length: Math.max(lineup.length, index + 1) }, (_, seat) => {
    const holder = lineup.at(seat) ?? null

    return seat === index ? playerId : holder === playerId ? null : holder
  })
