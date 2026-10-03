import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { TableNumber } from '@scoreboard/protocol/identifiers'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'

import { isLingering } from './display-stage'

const RESULTS_KEPT = 8
const NEXT_KEPT = 6

/** A table with nothing on screen, and when its next match should start. */
export type FreeTable = {
  nextAtMs: InstantMs | null
  table: TableNumber
}

/** Everything the summary column tells besides the team encounters. */
export type DisplaySummary = {
  freeTables: FreeTable[]
  next: MatchView[]
  results: MatchView[]
}

const startOf = (match: MatchView): InstantMs | null =>
  match.timing.estimatedStartMs ?? match.plannedAtMs

export const displaySummaryFor = ({
  nowMs,
  onStage,
  snapshot,
  tables
}: {
  nowMs: InstantMs
  /** The tables that have a tile on screen. */
  onStage: readonly TableNumber[]
  snapshot: PublicSnapshot
  tables: readonly TableNumber[]
}): DisplaySummary => {
  const inScope = snapshot.matches.filter(
    (match) => match.table !== null && tables.includes(match.table)
  )

  const results = inScope
    .filter(
      (match) => match.state.status === 'finished' && !isLingering(match, nowMs)
    )
    .toSorted(
      (left, right) =>
        (right.timing.finishedAtMs ?? 0) - (left.timing.finishedAtMs ?? 0)
    )
    .slice(0, RESULTS_KEPT)

  const scheduled = inScope.filter(
    (match) => match.state.status === 'scheduled'
  )

  const freeTables = tables
    .filter((table) => !onStage.includes(table))
    .map((table) => {
      const nextOnTable = scheduled
        .filter((match) => match.table === table)
        .map(startOf)
        .filter((start) => start !== null)
        .toSorted((left, right) => left - right)[0]

      return { nextAtMs: nextOnTable ?? null, table }
    })

  const next = scheduled
    .filter((match) => startOf(match) !== null)
    .toSorted(
      (left, right) =>
        (startOf(left) ?? 0) - (startOf(right) ?? 0) ||
        (left.table ?? 0) - (right.table ?? 0)
    )
    .slice(0, NEXT_KEPT)

  return { freeTables, next, results }
}

/** The time the day's first match should start, or `null` when nothing is placed yet. */
export const firstStartOf = (snapshot: PublicSnapshot): InstantMs | null => {
  const starts = snapshot.matches.map(startOf).filter((start) => start !== null)

  return starts.length === 0
    ? snapshot.startsAtMs
    : Math.min(...starts, snapshot.startsAtMs ?? Number.POSITIVE_INFINITY)
}

/** Nothing has been played or begun: the screen waits for the first match. */
export const hasNotStarted = (snapshot: PublicSnapshot): boolean =>
  snapshot.matches.every((match) => match.state.status === 'scheduled')
