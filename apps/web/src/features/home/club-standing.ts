import type { ChampionshipPool } from '@scoreboard/protocol/championship'
import type {
  ClubRecord,
  DirectoryTeam
} from '@scoreboard/protocol/club-record'

import { poolStandingsFor } from '@scoreboard/core/championship/championship-standings'

import { currentPoolsOf } from '@/features/club/championship-edits'

/** Where one of our teams stands in its current pool. */
export type ClubStanding = {
  phase: ChampionshipPool['phase']
  rank: number
  team: DirectoryTeam
}

/** Our first team, in the club's order, whose current pool has a result: its rank there, as the club page's standings give it. */
export const leadingStandingOf = (record: ClubRecord): ClubStanding | null => {
  const pools = currentPoolsOf(record)

  for (const team of record.own.teams) {
    const pool = pools.find((candidate) => candidate.teams.includes(team.id))
    const standings = pool === undefined ? [] : poolStandingsFor(pool)
    const row = standings.find((candidate) => candidate.teamId === team.id)

    if (
      pool !== undefined &&
      row !== undefined &&
      standings.some((candidate) => candidate.played > 0)
    ) {
      return { phase: pool.phase, rank: row.rank, team }
    }
  }

  return null
}
