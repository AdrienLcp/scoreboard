import type { PlayerId, TeamId } from '@scoreboard/protocol/identifiers'

/** A player entered in the tournament: the club he stands for and his ranking points. */
export type Entrant = {
  clubId: TeamId | null
  id: PlayerId
  points: number | null
}

const byPointsDescending = (left: Entrant, right: Entrant): number =>
  (right.points ?? Number.NEGATIVE_INFINITY) -
  (left.points ?? Number.NEGATIVE_INFINITY)

/**
 * The pools the seeds give: the best player in pool 1, the next in pool 2 and
 * so on in turn, a player skipping a pool that already holds someone of his
 * club or is full. Each pool lists its players best first, which numbers them.
 */
export const seededPools = ({
  entrants,
  poolCount
}: {
  entrants: readonly Entrant[]
  poolCount: number
}): PlayerId[][] => {
  const pools: Entrant[][] = Array.from({ length: poolCount }, () => [])
  const poolSize = Math.ceil(entrants.length / poolCount)
  const seeds = entrants.toSorted(byPointsDescending)

  seeds.forEach((entrant, seedIndex) => {
    const turns = Array.from(
      { length: poolCount },
      (_, offset) => (seedIndex + offset) % poolCount
    )
    const hasRoom = (poolIndex: number) =>
      (pools[poolIndex]?.length ?? poolSize) < poolSize
    const hasNoClubmate = (poolIndex: number) =>
      entrant.clubId === null ||
      !(pools[poolIndex] ?? []).some(
        (seated) => seated.clubId === entrant.clubId
      )
    const chosen =
      turns.find(
        (poolIndex) => hasRoom(poolIndex) && hasNoClubmate(poolIndex)
      ) ??
      turns.find(hasRoom) ??
      0

    pools[chosen]?.push(entrant)
  })

  return pools.map((pool) =>
    pool.toSorted(byPointsDescending).map((entrant) => entrant.id)
  )
}
