import type { Result } from '@adrienlcp/result'

import type { WallPairingCode } from '@scoreboard/protocol/identifiers'
import type { PairedWall, WallPairingStatus } from '@scoreboard/protocol/routes'

/** The pairings' Durable Objects, one per code, as the front door reaches them. */
export type WallPairings = {
  claim: (
    code: WallPairingCode,
    wall: PairedWall
  ) => Promise<Result<void, 'not_found'>>
  collect: (code: WallPairingCode) => Promise<WallPairingStatus | null>
  open: (
    code: WallPairingCode
  ) => Promise<Result<{ expiresAtMs: number }, 'taken'>>
}
