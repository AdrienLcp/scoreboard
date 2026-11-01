import type { Result } from '@adrienlcp/result'
import {
  readRecognizedText,
  removeStored,
  type StorageReadError,
  type StorageWriteError,
  writeStoredText
} from '@adrienlcp/safe-storage'

import { type ClubCode, clubCodeSchema } from '@scoreboard/protocol/club-record'

const CLUB_CODE_KEY = 'scoreboard:club'

const isClubCode = (stored: string): stored is ClubCode =>
  clubCodeSchema.safeParse(stored).success

/** The code of the club this device prepares days for, if any. */
export const readClubCode = (): Result<ClubCode | null, StorageReadError> =>
  readRecognizedText({ isRecognized: isClubCode, key: CLUB_CODE_KEY })

export const writeClubCode = (
  code: ClubCode
): Result<void, StorageWriteError> =>
  writeStoredText({ key: CLUB_CODE_KEY, text: code })

/** Forgets the club here; its store stays on the server for its other devices. */
export const forgetClubCode = (): Result<void, StorageWriteError> =>
  removeStored(CLUB_CODE_KEY)
