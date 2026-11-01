import type { Result } from '@adrienlcp/result'

import type { ClubCode, ClubRecord } from '@scoreboard/protocol/club-record'

/** The clubs' Durable Objects, one per club code, as the front door reaches them. */
export type Clubs = {
  open: (code: ClubCode, record: ClubRecord) => Promise<Result<void, 'taken'>>
  read: (code: ClubCode) => Promise<ClubRecord | null>
  write: (
    code: ClubCode,
    record: ClubRecord
  ) => Promise<Result<void, 'not_found'>>
}
