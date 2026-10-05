import type {
  DisplayId,
  EncounterId,
  MatchId,
  PlayerId,
  ScoringEventId,
  TeamId
} from '@scoreboard/protocol/identifiers'

const newUuid = (): string => crypto.randomUUID()

export const newPlayerId = (): PlayerId => newUuid()

export const newTeamId = (): TeamId => newUuid()

export const newMatchId = (): MatchId => newUuid()

export const newEncounterId = (): EncounterId => newUuid()

export const newDisplayId = (): DisplayId => newUuid()

/** Minted by the device that scores, so the server recognises a resent event. */
export const newScoringEventId = (): ScoringEventId => newUuid()
