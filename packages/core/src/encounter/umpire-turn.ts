import type { MatchSetup } from '@scoreboard/protocol/event-setup'
import type { PlayerId, TableNumber } from '@scoreboard/protocol/identifiers'
import { type Side, sides } from '@scoreboard/protocol/side'

import { opponentOf } from '../match/opponent'

/** What the umpire's turn reads of a match of the sheet. */
export type SheetMatch = Pick<
  MatchSetup,
  'away' | 'home' | 'id' | 'table' | 'umpireId'
>

/** A player who may umpire a match, and the side of the encounter he plays for. */
export type UmpireCandidate = {
  playerId: PlayerId
  side: Side
}

const playersOf = (match: SheetMatch): PlayerId[] => [
  ...match.home.playerIds,
  ...match.away.playerIds
]

const unique = <T>(values: readonly T[]): T[] => [...new Set(values)]

/** The encounter's matches table by table, each table's in playing order, tables by first use. */
const byTable = (
  matches: readonly SheetMatch[]
): Map<TableNumber | null, SheetMatch[]> => {
  const tables = new Map<TableNumber | null, SheetMatch[]>()

  for (const match of matches) {
    tables.set(match.table, [...(tables.get(match.table) ?? []), match])
  }

  return tables
}

/**
 * The club whose turn it is: home and away take turns on each table, and the
 * second table starts with the club the first does not, so at any time each
 * club umpires one of the encounter's tables.
 */
const umpiringSideOf = ({
  tableIndex,
  turn
}: {
  tableIndex: number
  turn: number
}): Side => ((turn + tableIndex) % 2 === 0 ? 'home' : 'away')

/**
 * Who may umpire `match`, best first: the umpiring club's player who has just
 * played on this table, then that club's players of this table, then its
 * others; then the other club's, in the same order. Nobody of the match
 * itself, and nobody playing on another table of the encounter at the same
 * time.
 */
const rankedUmpiresOf = ({
  encounterMatches,
  match
}: {
  encounterMatches: readonly SheetMatch[]
  match: SheetMatch
}): UmpireCandidate[] => {
  const tables = byTable(encounterMatches)
  const tableMatches = tables.get(match.table) ?? [match]
  const turn = tableMatches.findIndex(({ id }) => id === match.id)
  const tableIndex = [...tables.keys()].indexOf(match.table)
  const playingMeanwhile = [...tables.entries()].flatMap(([table, others]) => {
    const other = table === match.table ? undefined : others.at(turn)

    return other === undefined ? [] : playersOf(other)
  })
  const busy = new Set([...playersOf(match), ...playingMeanwhile])
  const previous = turn > 0 ? tableMatches.at(turn - 1) : undefined

  const rankedFor = (side: Side): UmpireCandidate[] =>
    unique([
      ...(previous?.[side].playerIds ?? []),
      ...tableMatches.flatMap((other) => other[side].playerIds),
      ...encounterMatches.flatMap((other) => other[side].playerIds)
    ])
      .filter((playerId) => !busy.has(playerId))
      .map((playerId) => ({ playerId, side }))

  const umpiringSide = umpiringSideOf({ tableIndex, turn })

  return [...rankedFor(umpiringSide), ...rankedFor(opponentOf(umpiringSide))]
}

/**
 * The umpire of a match of a team encounter, `null` for nobody. The
 * organiser's choice wins while its player stays out of the match; otherwise
 * the clubs take turns, preferring a player who has just played on the table.
 */
export const umpireOf = ({
  encounterMatches,
  match
}: {
  /** Every match of the encounter, in the sheet's order. */
  encounterMatches: readonly SheetMatch[]
  match: SheetMatch
}): PlayerId | null => {
  if (match.umpireId === null) {
    return null
  }

  if (
    match.umpireId !== undefined &&
    !playersOf(match).includes(match.umpireId)
  ) {
    return match.umpireId
  }

  return rankedUmpiresOf({ encounterMatches, match }).at(0)?.playerId ?? null
}

/**
 * Every player of the encounter who could umpire `match`, the sheet's choice
 * first, then the players busy on another table, each side's in its own
 * order: the organiser's list to pick from.
 */
export const umpireCandidatesOf = ({
  encounterMatches,
  match
}: {
  encounterMatches: readonly SheetMatch[]
  match: SheetMatch
}): UmpireCandidate[] => {
  const ranked = rankedUmpiresOf({ encounterMatches, match })
  const ranks = new Set(ranked.map(({ playerId }) => playerId))
  const inMatch = new Set(playersOf(match))
  const meanwhile = sides.flatMap((side) =>
    unique(encounterMatches.flatMap((other) => other[side].playerIds))
      .filter((playerId) => !inMatch.has(playerId) && !ranks.has(playerId))
      .map((playerId) => ({ playerId, side }))
  )

  return [...ranked, ...meanwhile]
}
