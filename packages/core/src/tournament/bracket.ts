import type { Participant } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { Side } from '@scoreboard/protocol/side'
import type { MatchStage, Tournament } from '@scoreboard/protocol/tournament'

import { opponentOf } from '../match/opponent'
import { type PoolTable, poolTablesFor } from './pool-standings'

const NOBODY: Participant = { playerIds: [] }

const placeOf = (table: PoolTable | undefined, rank: number): Participant => {
  const standing = table?.isComplete
    ? table.standings.find((candidate) => candidate.rank === rank)
    : undefined

  return standing === undefined ? NOBODY : { playerIds: [standing.playerId] }
}

const semiFinalOf = (
  matches: readonly MatchView[],
  slot: 1 | 2
): MatchView | undefined =>
  matches.find(
    (match) => match.stage?.kind === 'semi-final' && match.stage.slot === slot
  )

const sideOf = (
  semiFinal: MatchView | undefined,
  outcome: 'winner' | 'loser'
): Participant => {
  const winner: Side | null = semiFinal?.state.winner ?? null

  if (semiFinal === undefined || winner === null) {
    return NOBODY
  }

  return semiFinal[outcome === 'winner' ? winner : opponentOf(winner)]
}

/** Who a bracket match brings together, as far as the pools and semi-finals have decided it. */
const bracketSidesFor = ({
  matches,
  stage,
  tables
}: {
  matches: readonly MatchView[]
  stage: MatchStage
  tables: readonly PoolTable[]
}): Record<Side, Participant> | null => {
  const [first, second] = tables
  const semiOne = semiFinalOf(matches, 1)
  const semiTwo = semiFinalOf(matches, 2)

  switch (stage.kind) {
    case 'semi-final':
      return stage.slot === 1
        ? { away: placeOf(second, 2), home: placeOf(first, 1) }
        : { away: placeOf(first, 2), home: placeOf(second, 1) }
    case 'final':
      return {
        away: sideOf(semiTwo, 'winner'),
        home: sideOf(semiOne, 'winner')
      }
    case 'third-place':
      return { away: sideOf(semiTwo, 'loser'), home: sideOf(semiOne, 'loser') }
    default:
      return null
  }
}

const isNamed = (participant: Participant): boolean =>
  participant.playerIds.length > 0

/**
 * The matches with each bracket side the organiser left empty filled in from
 * the pools' tables once a pool is over, and from the semi-finals once one is
 * won: nobody types who goes through.
 */
export const withBracketPlayers = ({
  matches,
  tournament
}: {
  matches: readonly MatchView[]
  tournament: Tournament
}): MatchView[] => {
  const tables = poolTablesFor({ matches, tournament })
  const fill = (current: MatchView[]): MatchView[] =>
    current.map((match) => {
      const sides =
        match.stage === null || match.stage === undefined
          ? null
          : bracketSidesFor({ matches: current, stage: match.stage, tables })

      return sides === null
        ? match
        : {
            ...match,
            away: isNamed(match.away) ? match.away : sides.away,
            home: isNamed(match.home) ? match.home : sides.home
          }
    })

  return fill(fill([...matches]))
}
