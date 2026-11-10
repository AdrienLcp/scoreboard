import type { ChampionshipPool } from '@scoreboard/protocol/championship'
import type {
  ClubRecord,
  DirectoryTeam
} from '@scoreboard/protocol/club-record'

import { poolStandingsFor } from '@scoreboard/core/championship/championship-standings'

import { currentPoolsOf } from '@/features/club/championship-edits'
import { teamNumberOf } from '@/features/club/federation-season'
import type { FederationPoolsById } from '@/features/club/use-federation-pools'

/** Where one of our teams stands in its current pool. */
export type ClubStanding = {
  phase: ChampionshipPool['phase']
  rank: number
  team: DirectoryTeam
}

type RankedRow = { played: number; rank: number }

/** Our team's row in the FFTT's standings, by our club's number and the number ending its name. */
const federationRowOf = (
  record: ClubRecord,
  team: DirectoryTeam,
  pool: ChampionshipPool,
  federationPools: FederationPoolsById
): { row: RankedRow | undefined; rows: RankedRow[] } | null => {
  const federationPool = federationPools.get(pool.id)

  if (federationPool === undefined) {
    return null
  }

  return {
    row: federationPool.standings.find(
      (candidate) =>
        candidate.clubNumber === record.own.number &&
        teamNumberOf(candidate.team) === teamNumberOf(team.name)
    ),
    rows: federationPool.standings
  }
}

/**
 * Our first team, in the club's order, whose current pool has a result: its
 * rank there, as the club page's standings give it, the FFTT's when it
 * answered for that pool.
 */
export const leadingStandingOf = (
  record: ClubRecord,
  federationPools: FederationPoolsById = new Map()
): ClubStanding | null => {
  const pools = currentPoolsOf(record)

  for (const team of record.own.teams) {
    const pool = pools.find((candidate) => candidate.teams.includes(team.id))

    if (pool === undefined) {
      continue
    }

    const handStandings = poolStandingsFor(pool)
    const { row, rows } = federationRowOf(
      record,
      team,
      pool,
      federationPools
    ) ?? {
      row: handStandings.find((candidate) => candidate.teamId === team.id),
      rows: handStandings
    }

    if (row !== undefined && rows.some((candidate) => candidate.played > 0)) {
      return { phase: pool.phase, rank: row.rank, team }
    }
  }

  return null
}
