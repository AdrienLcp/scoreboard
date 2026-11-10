import type {
  FederationClubNumber,
  FederationPoolReference
} from '@scoreboard/protocol/federation'

import {
  readFederationClubPlayers,
  readFederationClubTeams,
  readFederationPool,
  searchFederationClubs
} from '@/infrastructure/api/federation-api'

import { federationQuery } from './use-federation'

/** The shortest name the FFTT's club search accepts. */
export const CLUB_SEARCH_MIN_LENGTH = 2

export const useFederationClubPlayers = federationQuery({
  keyOf: (clubNumber: FederationClubNumber) => clubNumber,
  load: readFederationClubPlayers
})

export const useFederationClubTeams = federationQuery({
  keyOf: (clubNumber: FederationClubNumber) => clubNumber,
  load: readFederationClubTeams
})

const useClubSearch = federationQuery({
  keyOf: (query: string) => query.toLowerCase(),
  load: searchFederationClubs
})

export const useFederationClubSearch = (typed: string) => {
  const query = typed.trim()

  return useClubSearch(query.length < CLUB_SEARCH_MIN_LENGTH ? null : query)
}

export const useFederationPool = federationQuery({
  keyOf: (reference: FederationPoolReference) =>
    [reference.division, reference.pool, reference.organiser ?? ''].join(':'),
  load: readFederationPool
})
