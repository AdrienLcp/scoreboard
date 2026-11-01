import type { Result } from '@adrienlcp/result'

import type { ClubCode, ClubRecord } from '@scoreboard/protocol/club-record'
import type { LogoContentType, UploadedLogo } from '@scoreboard/protocol/logo'

/** A logo's image as the club uploaded it, served back byte for byte. */
export type StoredLogo = {
  bytes: ArrayBuffer
  contentType: LogoContentType
}

/** The clubs' Durable Objects, one per club code, as the front door reaches them. */
export type Clubs = {
  open: (code: ClubCode, record: ClubRecord) => Promise<Result<void, 'taken'>>
  read: (code: ClubCode) => Promise<ClubRecord | null>
  /** By the club's room id, never its code: the wall and the spectators read it. */
  readLogo: (roomId: string, logoId: string) => Promise<StoredLogo | null>
  storeLogo: (
    code: ClubCode,
    logo: StoredLogo
  ) => Promise<Result<UploadedLogo, 'not_found'>>
  write: (
    code: ClubCode,
    record: ClubRecord
  ) => Promise<Result<void, 'not_found'>>
}
