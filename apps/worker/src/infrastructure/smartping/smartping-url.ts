import type { InstantMs } from '@scoreboard/protocol/scoring-event'

import {
  signSmartpingTimestamp,
  smartpingTimestampOf
} from './smartping-signature.ts'

export const SMARTPING_BASE_URL = 'https://apiv2.fftt.com/mobile/pxml/'

export type SmartpingEndpoint =
  | 'xml_chp_renc'
  | 'xml_club_b'
  | 'xml_club_dep2'
  | 'xml_equipe'
  | 'xml_initialisation'
  | 'xml_licence_b'
  | 'xml_liste_joueur_o'
  | 'xml_result_equ'

/** A call's business parameters: the signature is added when it goes out. */
export type SmartpingRequest = {
  endpoint: SmartpingEndpoint
  params: Readonly<Record<string, string>>
}

/** `id` is the app ID the FFTT issues, `key` the MD5 of its password, `serial` the worker's registered serial. */
export type SmartpingCredentials = {
  appId: string
  key: string
  serial: string
}

/**
 * The cache key: the endpoint and its business parameters, sorted, without
 * `id`, `serie`, `tm` or `tmc`, so two calls for the same data share one entry
 * whenever they were signed.
 */
export const smartpingCacheKeyOf = ({
  endpoint,
  params
}: SmartpingRequest): string => {
  const url = new URL(`${endpoint}.php`, SMARTPING_BASE_URL)

  for (const name of Object.keys(params).sort()) {
    url.searchParams.append(name, params[name] ?? '')
  }

  return url.href
}

/** The request as it goes out: its parameters, then the app ID, the serial, and the timestamp signed now. */
export const signedSmartpingUrlOf = async (
  request: SmartpingRequest,
  credentials: SmartpingCredentials,
  instantMs: InstantMs
): Promise<string> => {
  const url = new URL(smartpingCacheKeyOf(request))
  const timestamp = smartpingTimestampOf(instantMs)
  url.searchParams.set('id', credentials.appId)
  url.searchParams.set('serie', credentials.serial)
  url.searchParams.set('tm', timestamp)
  url.searchParams.set(
    'tmc',
    await signSmartpingTimestamp(credentials.key, timestamp)
  )

  return url.href
}
