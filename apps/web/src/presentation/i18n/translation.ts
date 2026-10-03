import type { DotPath, PlainKey, Translator } from '@adrienlcp/i18n'

import type { EncounterFormatId } from '@scoreboard/protocol/encounter-format-id'
import type {
  ProtocolErrorCode,
  RecordRefusal,
  SetupRefusal
} from '@scoreboard/protocol/error-code'

import type { ApiError } from '@/infrastructure/api/scoreboard-api'
import type { SocketStatus } from '@/infrastructure/messaging/use-event-socket'

import type { FR_DICTIONARY } from './dictionary-fr'

export type TranslationKey = DotPath<typeof FR_DICTIONARY>

/** A key whose message carries no placeholder: what state or a lookup table may hold. */
export type PlainTranslationKey = PlainKey<typeof FR_DICTIONARY>

export type Translate = Translator<typeof FR_DICTIONARY>

/** Checks that the dictionary holds every key a builder can return. */
type BuiltKey<Key extends PlainTranslationKey> = Key

export const protocolErrorKey = (
  code: ProtocolErrorCode
): BuiltKey<`error.${ProtocolErrorCode}`> => `error.${code}`

export const recordRefusalKey = (
  refusal: RecordRefusal
): BuiltKey<`record.refused.${RecordRefusal}`> => `record.refused.${refusal}`

export const setupRefusalKey = (
  refusal: SetupRefusal
): BuiltKey<`setup.refused.${SetupRefusal}`> => `setup.refused.${refusal}`

export const apiErrorKey = (
  error: ApiError
): BuiltKey<`error.api.${ApiError}`> => `error.api.${error}`

export const socketStatusKey = (
  status: SocketStatus
): BuiltKey<`connection.${SocketStatus}`> => `connection.${status}`

export const encounterFormatKey = (
  id: EncounterFormatId
): BuiltKey<`encounter.format.${EncounterFormatId}`> => `encounter.format.${id}`
