import type { EventSetup, MatchSetup } from '@scoreboard/protocol/event-setup'
import type { PlayerId } from '@scoreboard/protocol/identifiers'
import type { MatchStage, Pool } from '@scoreboard/protocol/tournament'

const pairKeyOf = (left: PlayerId, right: PlayerId): string =>
  [left, right].toSorted().join('|')

const playersOf = (match: MatchSetup): PlayerId[] => [
  ...match.home.playerIds,
  ...match.away.playerIds
]

/** Every pair of the pool's players meets exactly once, each match between two of them. */
const isRoundRobinOf = (
  pool: Pool,
  matches: readonly MatchSetup[]
): boolean => {
  const poolPlayerIds = new Set(pool.playerIds)
  const expected = pool.playerIds.flatMap((playerId, index) =>
    pool.playerIds.slice(index + 1).map((other) => pairKeyOf(playerId, other))
  )
  const played = matches.flatMap((match) => {
    const [home] = match.home.playerIds
    const [away] = match.away.playerIds
    const isSinglesOfThePool =
      match.home.playerIds.length === 1 &&
      match.away.playerIds.length === 1 &&
      home !== undefined &&
      away !== undefined &&
      poolPlayerIds.has(home) &&
      poolPlayerIds.has(away)

    return isSinglesOfThePool ? [pairKeyOf(home, away)] : ['']
  })

  return (
    played.length === expected.length &&
    new Set(played).size === played.length &&
    expected.every((pair) => played.includes(pair))
  )
}

const countOf = (
  matches: readonly MatchSetup[],
  isStage: (stage: MatchStage) => boolean
): number =>
  matches.filter((match) => match.stage != null && isStage(match.stage)).length

/**
 * Whether a tournament holds together: its pools name known players, each
 * once; each pool's matches are its round robin, nothing more; the bracket
 * has one of each semi-final, one final and at most one third-place match,
 * between pool players. Without a tournament no match carries a stage.
 */
export const isTournamentConsistent = (setup: EventSetup): boolean => {
  const { tournament } = setup
  const staged = setup.matches.filter((match) => match.stage != null)

  if (tournament === null || tournament === undefined) {
    return staged.length === 0
  }

  const knownPlayerIds = new Set(setup.players.map((player) => player.id))
  const poolPlayerIds = tournament.pools.flatMap((pool) => pool.playerIds)
  const poolIds = tournament.pools.map((pool) => pool.id)
  const arePoolsSound =
    new Set(poolIds).size === poolIds.length &&
    new Set(poolPlayerIds).size === poolPlayerIds.length &&
    poolPlayerIds.every((playerId) => knownPlayerIds.has(playerId))

  if (!arePoolsSound) {
    return false
  }

  const inPool = new Set(poolPlayerIds)
  const isEveryPoolMatchOfAPool = staged.every(
    (match) =>
      match.stage?.kind !== 'pool' || poolIds.includes(match.stage.poolId)
  )
  const isEveryPoolPlayed = tournament.pools.every((pool) =>
    isRoundRobinOf(
      pool,
      staged.filter(
        (match) =>
          match.stage?.kind === 'pool' && match.stage.poolId === pool.id
      )
    )
  )
  const bracket = staged.filter((match) => match.stage?.kind !== 'pool')
  const isBracketComplete =
    countOf(
      bracket,
      (stage) => stage.kind === 'semi-final' && stage.slot === 1
    ) === 1 &&
    countOf(
      bracket,
      (stage) => stage.kind === 'semi-final' && stage.slot === 2
    ) === 1 &&
    countOf(bracket, (stage) => stage.kind === 'final') === 1 &&
    countOf(bracket, (stage) => stage.kind === 'third-place') <= 1 &&
    bracket.every((match) =>
      playersOf(match).every((playerId) => inPool.has(playerId))
    )

  return isEveryPoolMatchOfAPool && isEveryPoolPlayed && isBracketComplete
}
