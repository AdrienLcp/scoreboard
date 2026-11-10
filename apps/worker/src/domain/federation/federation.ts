import type { Result } from '@adrienlcp/result'

import type {
  FederationClub,
  FederationClubNumber,
  FederationClubSearch,
  FederationEncounter,
  FederationEncounterReference,
  FederationPlayer,
  FederationPlayerSearch,
  FederationPool,
  FederationPoolReference,
  FederationTeam
} from '@scoreboard/protocol/federation'
import type { Licence } from '@scoreboard/protocol/licensee'

/**
 * Why the federation's data could not be read: the worker holds no
 * credentials, or the FFTT failed or refused the call.
 */
export type FederationFailure = 'not_configured' | 'unavailable'

export type FederationAnswer<TData> = Promise<Result<TData, FederationFailure>>

/** The FFTT's data as the routes read it, whatever serves it: the Smartping API, a fake for local work, or nothing. */
export type Federation = {
  clubPlayers: (
    club: FederationClubNumber
  ) => FederationAnswer<FederationPlayer[]>
  clubTeams: (club: FederationClubNumber) => FederationAnswer<FederationTeam[]>
  /** `null` until the federation has the encounter's sheet. */
  encounter: (
    reference: FederationEncounterReference
  ) => FederationAnswer<FederationEncounter | null>
  player: (licence: Licence) => FederationAnswer<FederationPlayer | null>
  pool: (reference: FederationPoolReference) => FederationAnswer<FederationPool>
  searchClubs: (
    search: FederationClubSearch
  ) => FederationAnswer<FederationClub[]>
  searchPlayers: (
    search: FederationPlayerSearch
  ) => FederationAnswer<FederationPlayer[]>
}
