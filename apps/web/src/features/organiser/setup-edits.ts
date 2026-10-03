import type {
  Encounter,
  EventSetup,
  MatchSetup,
  Player,
  Team
} from '@scoreboard/protocol/event-setup'
import type {
  MatchId,
  PlayerId,
  TableNumber
} from '@scoreboard/protocol/identifiers'

import { encounterFormatFor } from '@scoreboard/core/encounter/encounter-formats'
import {
  type Lineup,
  sheetMatchesFor
} from '@scoreboard/core/encounter/encounter-sheet'

export const addPlayer = (setup: EventSetup, player: Player): EventSetup => ({
  ...setup,
  players: [...setup.players, player]
})

/** Removes the player and their seat in every match, which then waits for someone to be named. */
export const removePlayer = (
  setup: EventSetup,
  playerId: PlayerId
): EventSetup => {
  const without = (match: MatchSetup, side: 'home' | 'away') => ({
    playerIds: match[side].playerIds.filter((id) => id !== playerId)
  })

  return {
    ...setup,
    matches: setup.matches.map((match) => ({
      ...match,
      away: without(match, 'away'),
      home: without(match, 'home')
    })),
    players: setup.players.filter((player) => player.id !== playerId)
  }
}

export const addTeam = (setup: EventSetup, team: Team): EventSetup => ({
  ...setup,
  teams: [...setup.teams, team]
})

export const addMatch = (setup: EventSetup, match: MatchSetup): EventSetup => ({
  ...setup,
  matches: [...setup.matches, match]
})

export const removeMatch = (
  setup: EventSetup,
  matchId: MatchId
): EventSetup => ({
  ...setup,
  matches: setup.matches.filter((match) => match.id !== matchId)
})

export const moveMatchToTable = ({
  matchId,
  setup,
  table
}: {
  matchId: MatchId
  setup: EventSetup
  table: TableNumber | null
}): EventSetup => ({
  ...setup,
  matches: setup.matches.map((match) =>
    match.id === matchId ? { ...match, table } : match
  )
})

/** Fewer tables takes the matches off the tables that are gone. */
export const changeTableCount = (
  setup: EventSetup,
  tableCount: number
): EventSetup => ({
  ...setup,
  matches: setup.matches.map((match) =>
    match.table !== null && match.table > tableCount
      ? { ...match, table: null }
      : match
  ),
  tableCount
})

/** Adds a team encounter and every match of its sheet, in playing order. */
export const addEncounter = ({
  encounter,
  lineups,
  newMatchId,
  setup
}: {
  encounter: Encounter
  lineups: { away: Lineup; home: Lineup }
  newMatchId: () => MatchId
  setup: EventSetup
}): EventSetup => ({
  ...setup,
  encounters: [...setup.encounters, encounter],
  matches: [
    ...setup.matches,
    ...sheetMatchesFor({
      encounter,
      format: encounterFormatFor(encounter.formatId),
      lineups,
      newMatchId
    })
  ]
})
