import type { EventSetup, MatchSetup } from '@scoreboard/protocol/event-setup'
import type { MatchId, TableNumber } from '@scoreboard/protocol/identifiers'
import type { MatchStatus } from '@scoreboard/protocol/match-state'

import {
  hallPlanOf,
  isHiddenIn,
  putAwayHallTables,
  standingTablesOf
} from './hall-plan'

/**
 * Where a match running on a table put away goes on: another standing table,
 * or `'waiting'`, on no table until the first one freed takes it.
 */
export type PutAwayDestination = TableNumber | 'waiting'

/** What a match has come to, by its id: one never started is `scheduled`. */
export type MatchStatusOf = (matchId: MatchId) => MatchStatus

const isOn = (
  match: MatchSetup,
  tables: readonly TableNumber[]
): match is MatchSetup & { table: TableNumber } =>
  match.table !== null && tables.includes(match.table)

/** The matches being played on these tables right now, in table order. */
export const matchesRunningOn = ({
  matches,
  statusOf,
  tables
}: {
  matches: readonly MatchSetup[]
  statusOf: MatchStatusOf
  tables: readonly TableNumber[]
}): (MatchSetup & { table: TableNumber })[] =>
  matches
    .flatMap((match) =>
      isOn(match, tables) && statusOf(match.id) === 'live' ? [match] : []
    )
    .toSorted((one, other) => one.table - other.table)

const busyTablesOf = (
  matches: readonly MatchSetup[],
  statusOf: MatchStatusOf
): Set<TableNumber> =>
  new Set(
    matches.flatMap((match) =>
      match.table !== null && statusOf(match.id) === 'live' ? [match.table] : []
    )
  )

/**
 * The tables a match running on a table put away can go on to, in order:
 * standing, not put away with it, nothing played on them, and not already
 * chosen for another match.
 */
export const freeTablesFor = ({
  leaving,
  setup,
  statusOf,
  taken
}: {
  leaving: readonly TableNumber[]
  setup: EventSetup
  statusOf: MatchStatusOf
  taken: readonly TableNumber[]
}): TableNumber[] => {
  const busy = busyTablesOf(setup.matches, statusOf)

  return standingTablesOf(hallPlanOf(setup), leaving)
    .map((standing) => standing.table)
    .filter((table) => !busy.has(table) && !taken.includes(table))
}

/**
 * Puts tables away for the day with what was to be played on them. A match
 * running there goes on where the organiser chose: on another table, or on
 * none while it waits for the first table freed. A match still to come moves
 * to another standing table of its encounter, else follows the running match
 * to its new table, else keeps the number and comes back with the table. A
 * finished match keeps the table it was played on.
 */
export const putAwayTables = ({
  destinations,
  setup,
  statusOf,
  tables
}: {
  destinations: ReadonlyMap<MatchId, PutAwayDestination>
  setup: EventSetup
  statusOf: MatchStatusOf
  tables: readonly TableNumber[]
}): EventSetup => {
  const plan = hallPlanOf(setup)
  const isStillStanding = (table: TableNumber | null): table is TableNumber =>
    table !== null && !tables.includes(table) && !isHiddenIn(plan, table)
  const followedTo = new Map(
    matchesRunningOn({ matches: setup.matches, statusOf, tables }).flatMap(
      (running) => {
        const destination = destinations.get(running.id)

        return typeof destination === 'number'
          ? [[running.table, destination] as const]
          : []
      }
    )
  )
  const encounterTableOf = (match: MatchSetup): TableNumber | undefined => {
    if (match.encounterId === null) {
      return undefined
    }

    const table = setup.matches.find(
      (other) =>
        other.encounterId === match.encounterId && isStillStanding(other.table)
    )?.table

    return table ?? undefined
  }
  const placed = (match: MatchSetup): MatchSetup => {
    if (!isOn(match, tables)) {
      return match
    }

    switch (statusOf(match.id)) {
      case 'finished':
        return match
      case 'live': {
        const destination = destinations.get(match.id)

        return destination === undefined
          ? match
          : { ...match, table: destination === 'waiting' ? null : destination }
      }
      case 'scheduled':
        return {
          ...match,
          table:
            encounterTableOf(match) ??
            followedTo.get(match.table) ??
            match.table
        }
    }
  }

  return {
    ...setup,
    hall: putAwayHallTables(plan, tables),
    matches: setup.matches.map(placed)
  }
}

/** The matches started then left on no table: they wait, in playing order, for a table freed. */
export const waitingMatchesOf = ({
  matches,
  statusOf
}: {
  matches: readonly MatchSetup[]
  statusOf: MatchStatusOf
}): MatchSetup[] =>
  matches.filter(
    (match) => match.table === null && statusOf(match.id) === 'live'
  )

/**
 * A table freed, its match over or put back from the reserve, takes the first
 * match waiting for one, which resumes there ahead of the table's own next
 * match; the matches of its encounter still to come on a table put away go
 * there with it. The same setup when nothing waits, or the table is put away
 * or still playing.
 */
export const resumeWaitingMatchOn = ({
  setup,
  statusOf,
  table
}: {
  setup: EventSetup
  statusOf: MatchStatusOf
  table: TableNumber
}): EventSetup => {
  const plan = hallPlanOf(setup)
  const [first] = waitingMatchesOf({ matches: setup.matches, statusOf })

  if (
    first === undefined ||
    table > setup.tableCount ||
    isHiddenIn(plan, table) ||
    busyTablesOf(setup.matches, statusOf).has(table)
  ) {
    return setup
  }

  const isLeftBehind = (match: MatchSetup): boolean =>
    first.encounterId !== null &&
    match.encounterId === first.encounterId &&
    match.table !== null &&
    isHiddenIn(plan, match.table) &&
    statusOf(match.id) === 'scheduled'

  return {
    ...setup,
    matches: setup.matches.map((match) =>
      match.id === first.id || isLeftBehind(match) ? { ...match, table } : match
    )
  }
}
