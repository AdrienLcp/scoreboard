import { Result } from '@adrienlcp/result'
import { z } from 'zod'

import type { InstantMs } from '@scoreboard/protocol/scoring-event'

import type { Federation } from '@/domain/federation/federation'

import { fakeFederation } from './fake-federation'
import {
  createSmartpingClient,
  type Fetch,
  type ResponseCache
} from './smartping-client'
import { createSmartpingFederation } from './smartping-federation'
import { smartpingKeyOf } from './smartping-signature.ts'

/** The worker's Smartping secrets, absent until the FFTT issues them; `SMARTPING_FAKE=1` only ever in `.dev.vars`. */
export type FederationSettings = {
  SMARTPING_APP_ID?: string
  SMARTPING_FAKE?: string
  SMARTPING_PASSWORD?: string
  SMARTPING_SERIAL?: string
}

const smartpingSecretsSchema = z.object({
  SMARTPING_APP_ID: z.string().trim().min(1),
  SMARTPING_PASSWORD: z.string().min(1),
  SMARTPING_SERIAL: z.string().regex(/^[A-Z0-9]{15}$/)
})

const notConfigured = async () => Result.failure('not_configured' as const)

/** Without credentials, every call says so: the web app hides what comes from the federation. */
export const unconfiguredFederation: Federation = {
  clubPlayers: notConfigured,
  clubTeams: notConfigured,
  encounter: notConfigured,
  player: notConfigured,
  pool: notConfigured,
  searchClubs: notConfigured,
  searchPlayers: notConfigured
}

/** The federation the settings call for: the fake, the Smartping API when all three secrets are there, else none. */
export const federationOf = ({
  cache,
  fetch,
  now,
  settings
}: {
  cache: () => ResponseCache
  fetch: Fetch
  now: () => InstantMs
  settings: FederationSettings
}): Federation => {
  if (settings.SMARTPING_FAKE === '1') {
    return fakeFederation
  }

  const secrets = smartpingSecretsSchema.safeParse(settings)

  if (!secrets.success) {
    return unconfiguredFederation
  }

  return createSmartpingFederation(
    createSmartpingClient({
      cache: cache(),
      credentials: {
        appId: secrets.data.SMARTPING_APP_ID,
        key: smartpingKeyOf(secrets.data.SMARTPING_PASSWORD),
        serial: secrets.data.SMARTPING_SERIAL
      },
      fetch,
      now
    })
  )
}
