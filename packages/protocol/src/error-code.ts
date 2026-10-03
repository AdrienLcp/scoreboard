import { z } from 'zod'

export const protocolErrorCodes = [
  'event_not_found',
  'wrong_code',
  'hello_expected',
  'not_allowed',
  'invalid_message',
  'invalid_setup',
  'protocol_version_mismatch',
  'internal_error'
] as const
export const protocolErrorCodeSchema = z.enum(protocolErrorCodes)
export type ProtocolErrorCode = z.infer<typeof protocolErrorCodeSchema>

/** Why a scoring event was turned down. The console drops it and says so. */
export const recordRefusals = [
  'match_not_found',
  'match_not_on_table',
  'not_started',
  'already_started',
  'match_over',
  'nothing_to_undo',
  'invalid_score',
  'cannot_end'
] as const
export const recordRefusalSchema = z.enum(recordRefusals)
export type RecordRefusal = z.infer<typeof recordRefusalSchema>

/** Why a saved setup was turned down. */
export const setupRefusals = [
  'duplicate_id',
  'unknown_player',
  'unknown_team',
  'unknown_encounter',
  'table_out_of_range',
  'player_twice_in_match',
  'unknown_display_table'
] as const
export const setupRefusalSchema = z.enum(setupRefusals)
export type SetupRefusal = z.infer<typeof setupRefusalSchema>
