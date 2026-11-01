import type {
  Display,
  Encounter,
  EventSetup,
  MatchSetup,
  Player,
  Team
} from '@scoreboard/protocol/event-setup'
import type { HallPlan } from '@scoreboard/protocol/hall-plan'
import type {
  DisplayId,
  EncounterId,
  MatchId,
  PlayerId,
  TableNumber
} from '@scoreboard/protocol/identifiers'
import type { TableTennisFormat } from '@scoreboard/protocol/match-format'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'

import { defaultTablesFor } from '@scoreboard/core/club/club-encounter'
import { encounterFormatFor } from '@scoreboard/core/encounter/encounter-formats'
import {
  type Lineup,
  sheetMatchesFor
} from '@scoreboard/core/encounter/encounter-sheet'
import {
  addHallTable,
  deleteHallTable,
  hallPlanOf
} from '@scoreboard/core/hall/hall-plan'

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
      home: without(match, 'home'),
      umpireId: match.umpireId === playerId ? undefined : match.umpireId
    })),
    players: setup.players.filter((player) => player.id !== playerId)
  }
}

/** The organiser naming a match's umpire: `null` for nobody, `undefined` to leave it to the clubs' turn. */
export const chooseUmpire = ({
  matchId,
  setup,
  umpireId
}: {
  matchId: MatchId
  setup: EventSetup
  umpireId: PlayerId | null | undefined
}): EventSetup => ({
  ...setup,
  matches: setup.matches.map((match) =>
    match.id === matchId ? { ...match, umpireId } : match
  )
})

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

/** Each match of an encounter may be played over its own number of games, 5 or 7 in one sheet. */
export const changeBestOf = ({
  bestOf,
  matchId,
  setup
}: {
  bestOf: TableTennisFormat['bestOf']
  matchId: MatchId
  setup: EventSetup
}): EventSetup => ({
  ...setup,
  matches: setup.matches.map((match) =>
    match.id === matchId
      ? { ...match, format: { ...match.format, bestOf } }
      : match
  )
})

export const planMatch = ({
  matchId,
  plannedAtMs,
  setup
}: {
  matchId: MatchId
  plannedAtMs: InstantMs | null
  setup: EventSetup
}): EventSetup => ({
  ...setup,
  matches: setup.matches.map((match) =>
    match.id === matchId ? { ...match, plannedAtMs } : match
  )
})

/**
 * Fewer tables takes the matches off the tables that are gone, and the
 * tables off the displays; a display left with no table goes too.
 */
export const changeTableCount = (
  setup: EventSetup,
  tableCount: number
): EventSetup => ({
  ...setup,
  displays: setup.displays
    .map((display) => ({
      ...display,
      tables: display.tables.filter((table) => table <= tableCount)
    }))
    .filter((display) => display.tables.length > 0),
  matches: setup.matches.map((match) =>
    match.table !== null && match.table > tableCount
      ? { ...match, table: null }
      : match
  ),
  tableCount
})

export const addDisplay = (
  setup: EventSetup,
  display: Display
): EventSetup => ({
  ...setup,
  displays: [...setup.displays, display]
})

export const removeDisplay = (
  setup: EventSetup,
  displayId: DisplayId
): EventSetup => ({
  ...setup,
  displays: setup.displays.filter((display) => display.id !== displayId)
})

/** Every table from `first` to `last`, both included. */
export const tableRange = ({
  first,
  last
}: {
  first: TableNumber
  last: TableNumber
}): TableNumber[] =>
  Array.from(
    { length: Math.max(0, last - first + 1) },
    (_, index) => first + index
  )

/** Adds a team encounter and every match of its sheet, in playing order, on the first free tables. */
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
      newMatchId,
      tables: defaultTablesFor({
        format: encounterFormatFor(encounter.formatId),
        preferred: [],
        setup
      })
    })
  ]
})

/** The tables an encounter is seated on, in the order of its sheet's groups. */
export const encounterTablesOf = (
  setup: EventSetup,
  encounterId: EncounterId
): TableNumber[] => [
  ...new Set(
    setup.matches.flatMap((match) =>
      match.encounterId === encounterId && match.table !== null
        ? [match.table]
        : []
    )
  )
]

const reseat = ({
  encounter,
  setup,
  tables
}: {
  encounter: Encounter
  setup: EventSetup
  tables: readonly TableNumber[] | null
}): MatchSetup[] => {
  const { sheet } = encounterFormatFor(encounter.formatId)
  let line = 0

  return setup.matches.map((match) => {
    if (match.encounterId !== encounter.id) {
      return match
    }

    const group = sheet[line]?.group ?? 1
    line++

    return { ...match, table: tables?.[group - 1] ?? null }
  })
}

/**
 * Seats a whole encounter on a block of the hall, each line of its sheet on
 * its group's table; an encounter already there takes the block it leaves.
 */
export const seatEncounterOnBlock = ({
  block,
  encounterId,
  setup
}: {
  block: readonly TableNumber[]
  encounterId: EncounterId
  setup: EventSetup
}): EventSetup => {
  const moved = setup.encounters.find(
    (encounter) => encounter.id === encounterId
  )

  if (moved === undefined) {
    return setup
  }

  const left = encounterTablesOf(setup, encounterId)
  const displaced = setup.encounters.find(
    (encounter) =>
      encounter.id !== encounterId &&
      encounterTablesOf(setup, encounter.id).some((table) =>
        block.includes(table)
      )
  )
  const seated = {
    ...setup,
    matches: reseat({ encounter: moved, setup, tables: block })
  }

  return displaced === undefined
    ? seated
    : {
        ...seated,
        matches: reseat({
          encounter: displaced,
          setup: seated,
          tables: left.length === 0 ? null : left
        })
      }
}

export const changeHall = (setup: EventSetup, hall: HallPlan): EventSetup => ({
  ...setup,
  hall
})

/** Takes every encounter off a block's tables: its matches wait for tables. */
export const clearBlock = (
  setup: EventSetup,
  block: readonly TableNumber[]
): EventSetup => {
  let cleared = setup

  for (const encounter of setup.encounters) {
    if (
      encounterTablesOf(setup, encounter.id).some((table) =>
        block.includes(table)
      )
    ) {
      cleared = {
        ...cleared,
        matches: reseat({ encounter, setup: cleared, tables: null })
      }
    }
  }

  return cleared
}

/** One more table, numbered after the last, at the next free spot of the plan. */
export const addTable = (setup: EventSetup): EventSetup => ({
  ...setup,
  hall: addHallTable(hallPlanOf(setup)),
  tableCount: setup.tableCount + 1
})

/**
 * A table gone for good: the others are numbered 1 to N again, every match
 * and screen following its table; the matches of the deleted one wait for a
 * table.
 */
export const deleteTable = (
  setup: EventSetup,
  table: TableNumber
): EventSetup => {
  const { numbers, plan } = deleteHallTable(hallPlanOf(setup), table)

  return {
    ...setup,
    displays: setup.displays
      .map((display) => ({
        ...display,
        tables: display.tables.flatMap((number) => numbers.get(number) ?? [])
      }))
      .filter((display) => display.tables.length > 0),
    hall: plan,
    matches: setup.matches.map((match) =>
      match.table === null
        ? match
        : { ...match, table: numbers.get(match.table) ?? null }
    ),
    tableCount: setup.tableCount - 1
  }
}
