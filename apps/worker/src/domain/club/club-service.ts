import { Result } from '@adrienlcp/result'

import type {
  ClubRecord,
  CreateClubInput,
  CreatedClub
} from '@scoreboard/protocol/club-record'

import {
  type DrawCode,
  newClubCode
} from '@scoreboard/core/access/access-codes'
import { DEFAULT_OPPONENT_COLOUR } from '@scoreboard/core/club/team-colours'

import type { Clubs } from './clubs'

/** A code is drawn at random; a clash with an existing club is retried. */
const OPEN_ATTEMPTS = 3

const emptyRecordFor = (
  input: CreateClubInput,
  newClubId: () => string
): ClubRecord => ({
  opponentColour: DEFAULT_OPPONENT_COLOUR,
  opponents: [],
  own: {
    id: newClubId(),
    name: input.name,
    number: null,
    players: [],
    teams: []
  }
})

/** Opens a club's store under a fresh code, the one key its organisers keep. */
export const createClub = async ({
  clubs,
  drawCode,
  input,
  newClubId
}: {
  clubs: Clubs
  drawCode: DrawCode
  input: CreateClubInput
  newClubId: () => string
}): Promise<Result<CreatedClub, 'no_free_club_code'>> => {
  for (let attempt = 0; attempt < OPEN_ATTEMPTS; attempt++) {
    const clubCode = newClubCode(drawCode)
    const opened = await clubs.open(clubCode, emptyRecordFor(input, newClubId))

    if (opened.status === 'success') {
      return Result.success({ clubCode })
    }
  }

  return Result.failure('no_free_club_code')
}
