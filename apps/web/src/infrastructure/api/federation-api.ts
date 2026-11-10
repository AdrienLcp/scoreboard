import { Result } from '@adrienlcp/result'
import { z } from 'zod'

import {
  type FederationClub,
  type FederationClubNumber,
  type FederationEncounter,
  type FederationEncounterReference,
  type FederationPlayer,
  type FederationPool,
  type FederationPoolReference,
  type FederationTeam,
  federationClubSchema,
  federationEncounterSchema,
  federationPlayerSchema,
  federationPoolSchema,
  federationTeamSchema
} from '@scoreboard/protocol/federation'
import {
  API_ROUTES,
  apiErrorResponseSchema,
  fillRoute
} from '@scoreboard/protocol/routes'

/**
 * Why the FFTT's data did not come: `off` when this server holds no FFTT
 * credentials (the app then hides everything federal), `down` when the FFTT
 * failed or refused, `offline` when the network did.
 */
export type FederationError = 'down' | 'off' | 'offline'

const readFederation = async <TData extends object>(
  url: string,
  schema: z.ZodType<TData>
): Promise<Result<TData, FederationError>> => {
  try {
    const response = await fetch(url)
    const body: unknown = await response.json().catch(() => null)

    if (!response.ok) {
      const error = apiErrorResponseSchema.safeParse(body)

      return Result.failure(
        error.success && error.data.code === 'federation_not_configured'
          ? 'off'
          : 'down'
      )
    }

    const data = schema.safeParse(body)

    return data.success ? Result.success(data.data) : Result.failure('down')
  } catch {
    return Result.failure('offline')
  }
}

const withQuery = (route: string, query: Record<string, string>) =>
  `${route}?${new URLSearchParams(query).toString()}`

/** The FFTT's clubs whose name holds the typed words, or the club of an 8-digit number. */
export const searchFederationClubs = (typed: string) =>
  readFederation<FederationClub[]>(
    withQuery(
      API_ROUTES.federationClubs,
      /^\d{8}$/.test(typed.trim())
        ? { number: typed.trim() }
        : { name: typed.trim() }
    ),
    z.array(federationClubSchema)
  )

/** A club's licensees as the FFTT lists them, with their points. */
export const readFederationClubPlayers = (clubNumber: FederationClubNumber) =>
  readFederation<FederationPlayer[]>(
    fillRoute(API_ROUTES.federationClubPlayers, { clubNumber }),
    z.array(federationPlayerSchema)
  )

/** A club's teams and the pool each plays in. */
export const readFederationClubTeams = (clubNumber: FederationClubNumber) =>
  readFederation<FederationTeam[]>(
    fillRoute(API_ROUTES.federationClubTeams, { clubNumber }),
    z.array(federationTeamSchema)
  )

/** A pool's standings and calendar. */
export const readFederationPool = (reference: FederationPoolReference) =>
  readFederation<FederationPool>(
    withQuery(API_ROUTES.federationPool, {
      division: reference.division,
      pool: reference.pool,
      ...(reference.organiser === undefined
        ? {}
        : { organiser: reference.organiser })
    }),
    federationPoolSchema
  )

/** An encounter's sheet, by the link its pool's calendar gives. */
export const readFederationEncounter = (
  reference: FederationEncounterReference
) =>
  readFederation<FederationEncounter>(
    withQuery(API_ROUTES.federationEncounter, reference),
    federationEncounterSchema
  )
