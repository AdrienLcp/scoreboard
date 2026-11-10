import type {
  FederationClubNumber,
  FederationEncounterReference,
  FederationPoolReference
} from '@scoreboard/protocol/federation'

import {
  readFederationClubPlayers,
  readFederationClubTeams,
  readFederationEncounter,
  readFederationPool,
  searchFederationClubs
} from '@/infrastructure/api/federation-api'

import { federationQuery } from './use-federation'

/** The shortest name the FFTT's club search accepts. */
export const CLUB_SEARCH_MIN_LENGTH = 2

export const useFederationClubPlayers = federationQuery({
  keyOf: (clubNumber: FederationClubNumber) => clubNumber,
  load: readFederationClubPlayers
}).one

export const useFederationClubTeams = federationQuery({
  keyOf: (clubNumber: FederationClubNumber) => clubNumber,
  load: readFederationClubTeams
}).one

const useClubSearch = federationQuery({
  keyOf: (query: string) => query.toLowerCase(),
  load: searchFederationClubs
}).one

export const useFederationClubSearch = (typed: string) => {
  const query = typed.trim()

  return useClubSearch(query.length < CLUB_SEARCH_MIN_LENGTH ? null : query)
}

const poolQuery = federationQuery({
  keyOf: (reference: FederationPoolReference) =>
    [reference.division, reference.pool, reference.organiser ?? ''].join(':'),
  load: readFederationPool
})

export const useFederationPool = poolQuery.one

/** Several pools at once: the day's round reads every pool our teams play in. */
export const useFederationPools = poolQuery.many

export const useFederationEncounter = federationQuery({
  keyOf: (reference: FederationEncounterReference) => reference.encounterId,
  load: readFederationEncounter
}).one
