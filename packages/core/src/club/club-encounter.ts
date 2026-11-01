import type {
  DirectoryClub,
  DirectoryPlayer,
  DirectoryTeam
} from '@scoreboard/protocol/club-record'
import type {
  Encounter,
  EventSetup,
  Player,
  Team
} from '@scoreboard/protocol/event-setup'
import type {
  EncounterId,
  MatchId,
  TableNumber
} from '@scoreboard/protocol/identifiers'

import type { EncounterFormat } from '../encounter/encounter-format'
import { encounterFormatFor } from '../encounter/encounter-formats'
import { type Lineup, sheetMatchesFor } from '../encounter/encounter-sheet'
import { hallPlanOf, isHiddenIn } from '../hall/hall-plan'

/** A club's team as it comes to the day: its record, its club for the players' names. */
export type ClubSide = { club: DirectoryClub; team: DirectoryTeam }

const displayNameOf = (player: DirectoryPlayer): string =>
  `${player.firstName} ${player.lastName}`

const eventPlayerOf = (player: DirectoryPlayer, team: Team): Player => ({
  id: player.id,
  licence: player.licence,
  name: displayNameOf(player),
  points: player.points,
  teamId: team.id
})

const eventTeamOf = (side: ClubSide, colour: string): Team => ({
  colour,
  id: side.team.id,
  name: side.team.name
})

const lineupOf = (team: DirectoryTeam, letters: readonly string[]): Lineup =>
  Object.fromEntries(
    letters.flatMap((letter, index) => {
      const playerId = team.lineup.at(index) ?? null

      return playerId === null ? [] : [[letter, playerId]]
    })
  )

const tablesInUse = (setup: EventSetup): Set<TableNumber> =>
  new Set(
    setup.matches.flatMap((match) =>
      match.encounterId !== null && match.table !== null ? [match.table] : []
    )
  )

/**
 * The tables an encounter goes on: the home team's own when free ("Angles 1
 * always on tables 1–2"), otherwise the first free block of the hall, one
 * table per group of the sheet; a table put away for the day is never free.
 * Fewer when the hall runs out; the organiser moves them.
 */
export const defaultTablesFor = ({
  format,
  preferred,
  setup
}: {
  format: EncounterFormat
  preferred: readonly TableNumber[]
  setup: EventSetup
}): TableNumber[] => {
  const used = tablesInUse(setup)
  const plan = hallPlanOf(setup)
  const isFree = (table: TableNumber) =>
    table <= setup.tableCount && !used.has(table) && !isHiddenIn(plan, table)

  if (preferred.length === format.groupCount && preferred.every(isFree)) {
    return [...preferred]
  }

  for (
    let first = 1;
    first + format.groupCount - 1 <= setup.tableCount;
    first += format.groupCount
  ) {
    const run = Array.from(
      { length: format.groupCount },
      (_, index) => first + index
    )

    if (run.every(isFree)) {
      return run
    }
  }

  return []
}

const withSide = (
  setup: EventSetup,
  side: ClubSide,
  colour: string
): EventSetup => {
  const team = eventTeamOf(side, colour)
  const knownTeam = setup.teams.some((candidate) => candidate.id === team.id)
  const knownPlayers = new Set(setup.players.map((player) => player.id))
  const newPlayers = side.team.lineup.flatMap((playerId) => {
    const player = side.club.players.find(
      (candidate) => playerId !== null && candidate.id === playerId
    )

    return player === undefined || knownPlayers.has(player.id)
      ? []
      : [eventPlayerOf(player, team)]
  })

  return {
    ...setup,
    players: [...setup.players, ...newPlayers],
    teams: knownTeam ? setup.teams : [...setup.teams, team]
  }
}

/**
 * Brings a club's encounter into the day: both teams with their colours, the
 * players of their last composition seated on their letters, and every match
 * of the home team's sheet on its tables. All of it stays editable.
 */
export const addClubEncounter = ({
  away,
  awayColour,
  encounterId,
  home,
  newMatchId,
  setup,
  tables
}: {
  away: ClubSide
  awayColour: string
  encounterId: EncounterId
  home: ClubSide
  newMatchId: () => MatchId
  setup: EventSetup
  tables: readonly TableNumber[]
}): EventSetup => {
  const format = encounterFormatFor(home.team.formatId)
  const encounter: Encounter = {
    away: away.team.id,
    formatId: home.team.formatId,
    home: home.team.id,
    id: encounterId,
    matchPoints: home.team.matchPoints
  }
  const withTeams = withSide(
    withSide(setup, home, home.team.colour),
    away,
    awayColour
  )

  return {
    ...withTeams,
    encounters: [...withTeams.encounters, encounter],
    matches: [
      ...withTeams.matches,
      ...sheetMatchesFor({
        encounter,
        format,
        lineups: {
          away: lineupOf(away.team, format.awayLetters),
          home: lineupOf(home.team, format.homeLetters)
        },
        newMatchId,
        tables
      })
    ]
  }
}
