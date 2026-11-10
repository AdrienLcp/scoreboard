import type { ChampionshipPoolId } from '@scoreboard/protocol/championship'
import type { ClubRecord } from '@scoreboard/protocol/club-record'
import type { FederationPool } from '@scoreboard/protocol/federation'

import { currentPoolsOf } from './championship-edits'
import {
  useFederationClubTeams,
  useFederationPools
} from './federation-queries'
import { federationTeamOf } from './federation-season'

/** The FFTT's pool of each current pool it answered for; a pool missing here stands on its hand-kept calendar. */
export type FederationPoolsById = ReadonlyMap<
  ChampionshipPoolId,
  FederationPool
>

/**
 * The FFTT's pools our teams play in now, matched as the club page matches
 * them (the pool's first team of ours, by the number ending its name), read
 * live and shared with the club page's cards.
 */
export const useCurrentFederationPools = (
  record: ClubRecord | null
): FederationPoolsById => {
  const pools = record === null ? [] : currentPoolsOf(record)
  const clubNumber = record?.own.number ?? null
  const teams = useFederationClubTeams(pools.length === 0 ? null : clubNumber)
  const linked =
    record === null || teams?.status !== 'ready'
      ? []
      : pools.flatMap((pool) => {
          const name = record.own.teams.find((team) =>
            pool.teams.includes(team.id)
          )?.name
          const reference =
            name === undefined
              ? null
              : (federationTeamOf({
                  name,
                  phase: pool.phase,
                  teams: teams.data
                })?.pool ?? null)

          return reference === null ? [] : [{ poolId: pool.id, reference }]
        })
  const states = useFederationPools(linked.map((link) => link.reference))

  return new Map(
    linked.flatMap((link, index) => {
      const state = states[index]

      return state?.status === 'ready'
        ? [[link.poolId, state.data] as const]
        : []
    })
  )
}
