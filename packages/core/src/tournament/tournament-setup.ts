import type { MatchSetup, Participant } from '@scoreboard/protocol/event-setup'
import type { MatchId, TableNumber } from '@scoreboard/protocol/identifiers'
import type { MatchFormat } from '@scoreboard/protocol/match-format'
import type { MatchStage, Pool } from '@scoreboard/protocol/tournament'

import { roundRobinRounds } from './round-robin'

/** How the sheet names each match, in the organiser's language. */
export type TournamentLabels = {
  final: string
  poolMatch: (pool: Pool, homeNumber: number, awayNumber: number) => string
  semiFinal: (slot: 1 | 2) => string
  thirdPlace: string
}

const seatOf = (pool: Pool, number: number): Participant => {
  const playerId = pool.playerIds[number - 1]

  return { playerIds: playerId === undefined ? [] : [playerId] }
}

/** Tables a pool plays on at once: one per pair of its players. */
export const tablesPerPool = (pool: Pool): number =>
  Math.floor(pool.playerIds.length / 2)

/**
 * Every match of the tournament in playing order: each pool on its own run of
 * tables (the first pool from `firstTable`), round after round, then the
 * semi-finals on the first two tables, the third-place match if wanted, and
 * the final on the first table. Bracket sides stay empty until the pools
 * decide them.
 */
export const tournamentMatchesFor = ({
  firstTable,
  format,
  hasThirdPlace,
  labels,
  newMatchId,
  pools
}: {
  firstTable: TableNumber
  format: MatchFormat
  hasThirdPlace: boolean
  labels: TournamentLabels
  newMatchId: () => MatchId
  pools: readonly Pool[]
}): MatchSetup[] => {
  const matchOf = ({
    away,
    home,
    label,
    stage,
    table
  }: Pick<MatchSetup, 'away' | 'home' | 'label' | 'table'> & {
    stage: MatchStage
  }): MatchSetup => ({
    away,
    encounterId: null,
    format,
    home,
    id: newMatchId(),
    label,
    plannedAtMs: null,
    stage,
    table
  })
  const poolMatches = pools.flatMap((pool, poolIndex) => {
    const poolFirstTable =
      firstTable +
      pools
        .slice(0, poolIndex)
        .reduce((sum, earlier) => sum + tablesPerPool(earlier), 0)

    return roundRobinRounds(pool.playerIds.length).flatMap((round) =>
      round.map(([homeNumber, awayNumber], slot) =>
        matchOf({
          away: seatOf(pool, awayNumber),
          home: seatOf(pool, homeNumber),
          label: labels.poolMatch(pool, homeNumber, awayNumber),
          stage: { kind: 'pool', poolId: pool.id },
          table: poolFirstTable + slot
        })
      )
    )
  })
  const nobody = { playerIds: [] }
  const bracketMatch = (stage: MatchStage, label: string, table: number) =>
    matchOf({ away: nobody, home: nobody, label, stage, table })

  return [
    ...poolMatches,
    bracketMatch(
      { kind: 'semi-final', slot: 1 },
      labels.semiFinal(1),
      firstTable
    ),
    bracketMatch(
      { kind: 'semi-final', slot: 2 },
      labels.semiFinal(2),
      firstTable + 1
    ),
    ...(hasThirdPlace
      ? [
          bracketMatch(
            { kind: 'third-place' },
            labels.thirdPlace,
            firstTable + 1
          )
        ]
      : []),
    bracketMatch({ kind: 'final' }, labels.final, firstTable)
  ]
}
