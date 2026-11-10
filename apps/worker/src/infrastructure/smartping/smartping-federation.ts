import { Result } from '@adrienlcp/result'

import {
  FEDERATION_BROWSER_CACHE_SECONDS,
  FEDERATION_CACHE_HOURS,
  type FederationClubSearch,
  type FederationTeam
} from '@scoreboard/protocol/federation'

import type {
  Federation,
  FederationAnswer
} from '@/domain/federation/federation'

import type { SmartpingClient } from './smartping-client'
import { clubsOf } from './smartping-clubs'
import { encounterOf } from './smartping-encounter'
import { linkParamsOfEncounter } from './smartping-encounter-link'
import { playersOfLicences, playersOfSpidList } from './smartping-players'
import { roundsOf, standingsOf } from './smartping-pool'
import { teamsOf } from './smartping-teams'
import type { SmartpingRequest } from './smartping-url'
import { parseSmartpingList, type SmartpingList } from './smartping-xml'

/**
 * Rosters, clubs and teams move once a month at most: kept as long as the
 * terms of use allow, less the hour a browser may keep the answer after.
 */
const DIRECTORY_MAX_AGE_SECONDS =
  FEDERATION_CACHE_HOURS * 60 * 60 - FEDERATION_BROWSER_CACHE_SECONDS

/** Results move on match days: an hour keeps them fresh the same evening. */
const RESULTS_MAX_AGE_SECONDS = 60 * 60

/**
 * The championship's teams: men's (`M`), women's (`F`), and every other
 * competition (no type). `A` is left out: the sources disagree on whether it
 * means both or mixed, and the three others already cover a club.
 */
const TEAM_TYPES = ['M', 'F', ''] as const

/** The FFTT's name search reads uppercase without accents, as its own clients send it. */
const searchableNameOf = (name: string) =>
  name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()

const clubSearchRequestOf = (
  search: FederationClubSearch
): SmartpingRequest => {
  if ('name' in search) {
    return {
      endpoint: 'xml_club_b',
      params: { ville: searchableNameOf(search.name) }
    }
  }

  if ('number' in search) {
    return { endpoint: 'xml_club_b', params: { numero: search.number } }
  }

  if ('postcode' in search) {
    return { endpoint: 'xml_club_b', params: { code: search.postcode } }
  }

  return { endpoint: 'xml_club_dep2', params: { dep: search.department } }
}

const uniqueTeams = (teams: readonly FederationTeam[]) => [
  ...new Map(teams.map((team) => [team.id, team])).values()
]

/** The federation's data read through the Smartping API: every answer from the cache when it holds it. */
export const createSmartpingFederation = (
  client: SmartpingClient
): Federation => {
  const read = async <TData>(
    request: SmartpingRequest,
    maxAgeSeconds: number,
    repeatedTags: readonly string[],
    map: (list: SmartpingList) => TData
  ): FederationAnswer<TData> => {
    const text = await client.read(request, maxAgeSeconds)

    if (text.status === 'failure') {
      return text
    }

    const list = parseSmartpingList(text.data, repeatedTags)

    if (list === null) {
      console.error({
        endpoint: request.endpoint,
        message: 'Smartping answer is no list'
      })

      return Result.failure('unavailable')
    }

    return Result.success(map(list))
  }

  return {
    clubPlayers: (club) =>
      read(
        // An empty `licence` beside `club`, as the client the FFTT's answers were recorded with sends it.
        { endpoint: 'xml_licence_b', params: { club, licence: '' } },
        DIRECTORY_MAX_AGE_SECONDS,
        ['licence'],
        (list) => playersOfLicences(list.licence ?? [])
      ),
    clubTeams: async (club) => {
      const answers = await Promise.all(
        TEAM_TYPES.map((type) =>
          read(
            { endpoint: 'xml_equipe', params: { numclu: club, type } },
            DIRECTORY_MAX_AGE_SECONDS,
            ['equipe'],
            (list) => teamsOf(list.equipe ?? [])
          )
        )
      )
      const teams: FederationTeam[] = []

      for (const answer of answers) {
        if (answer.status === 'failure') {
          return answer
        }

        teams.push(...answer.data)
      }

      return Result.success(uniqueTeams(teams))
    },
    encounter: (reference) =>
      read(
        { endpoint: 'xml_chp_renc', params: linkParamsOfEncounter(reference) },
        RESULTS_MAX_AGE_SECONDS,
        ['resultat', 'joueur', 'partie'],
        encounterOf
      ),
    player: (licence) =>
      read(
        { endpoint: 'xml_licence_b', params: { licence } },
        DIRECTORY_MAX_AGE_SECONDS,
        ['licence'],
        (list) => playersOfLicences(list.licence ?? [])[0] ?? null
      ),
    pool: async (reference) => {
      const params = {
        auto: '1',
        cx_poule: reference.pool,
        D1: reference.division,
        ...(reference.organiser === undefined
          ? {}
          : { organisme_pere: reference.organiser })
      }
      const [standings, rounds] = await Promise.all([
        read(
          {
            endpoint: 'xml_result_equ',
            params: { ...params, action: 'classement' }
          },
          RESULTS_MAX_AGE_SECONDS,
          ['classement'],
          (list) => standingsOf(list.classement ?? [])
        ),
        read(
          { endpoint: 'xml_result_equ', params },
          RESULTS_MAX_AGE_SECONDS,
          ['tour'],
          (list) => roundsOf(list.tour ?? [])
        )
      ])

      if (standings.status === 'failure') {
        return standings
      }

      if (rounds.status === 'failure') {
        return rounds
      }

      return Result.success({
        reference,
        rounds: rounds.data,
        standings: standings.data
      })
    },
    searchClubs: (search) =>
      read(
        clubSearchRequestOf(search),
        DIRECTORY_MAX_AGE_SECONDS,
        ['club'],
        (list) => clubsOf(list.club ?? [])
      ),
    searchPlayers: ({ firstName, lastName }) =>
      read(
        {
          endpoint: 'xml_liste_joueur_o',
          params: {
            nom: searchableNameOf(lastName),
            ...(firstName === undefined
              ? {}
              : { prenom: searchableNameOf(firstName) }),
            // This season's licences only: last season's are no use on a sheet.
            valid: '1'
          }
        },
        DIRECTORY_MAX_AGE_SECONDS,
        ['joueur'],
        (list) => playersOfSpidList(list.joueur ?? [])
      )
  }
}
