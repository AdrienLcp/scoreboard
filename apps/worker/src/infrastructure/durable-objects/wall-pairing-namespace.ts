import type { WallPairings } from '@/domain/wall-pairing/wall-pairings'

export const wallPairingsOf = (
  namespace: Env['WALL_PAIRINGS']
): WallPairings => {
  const roomOf = (code: string) => namespace.get(namespace.idFromName(code))

  return {
    claim: (code, wall) => roomOf(code).claim(wall),
    collect: (code) => roomOf(code).collect(),
    open: (code) => roomOf(code).open()
  }
}
