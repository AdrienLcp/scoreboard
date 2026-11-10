import { Result } from '@adrienlcp/result'
import { describe, expect, it } from 'vitest'

import { fakeFederation } from './fake-federation'
import { FAKE_POOL } from './fake-federation-data'
import { federationOf, unconfiguredFederation } from './federation-of-settings'
import type { SmartpingClient } from './smartping-client'
import { createSmartpingFederation } from './smartping-federation'
import { type SmartpingRequest, smartpingCacheKeyOf } from './smartping-url'

const teamXml = (id: string) =>
  `<liste><equipe><idequipe>${id}</idequipe><libequipe>PPC ANGLES ${id} - Phase 1</libequipe><libdivision>D1</libdivision><libepr>Championnat</libepr><liendivision><![CDATA[cx_poule=1&D1=2]]></liendivision></equipe></liste>`

/** A client that answers each unsigned URL from a table, and records what it was asked. */
const clientAnswering = (answers: Readonly<Record<string, string>>) => {
  const asked: SmartpingRequest[] = []
  const client: SmartpingClient = {
    read: async (request) => {
      asked.push(request)
      const body = answers[smartpingCacheKeyOf(request)]

      return body === undefined
        ? Result.failure('unavailable')
        : Result.success(body)
    }
  }

  return { asked, client }
}

const urlOf = (
  endpoint: SmartpingRequest['endpoint'],
  params: Record<string, string>
) => smartpingCacheKeyOf({ endpoint, params })

describe('the federation over Smartping', () => {
  it('[smartping] lists a club’s championship and other teams once each', async () => {
    const { client } = clientAnswering({
      [urlOf('xml_equipe', { numclu: '12850078', type: 'M' })]: teamXml('1'),
      [urlOf('xml_equipe', { numclu: '12850078', type: 'F' })]: '<liste/>',
      [urlOf('xml_equipe', {
        numclu: '12850078',
        type: ''
      })]: `<liste>${teamXml('1').slice(7, -8)}${teamXml('2').slice(7, -8)}</liste>`
    })

    const teams = await createSmartpingFederation(client).clubTeams('12850078')

    expect(
      teams.status === 'success' && teams.data.map((team) => team.id)
    ).toEqual(['1', '2'])
  })

  it('[smartping] fails the whole answer when one of its calls fails', async () => {
    const { client } = clientAnswering({})

    expect(
      await createSmartpingFederation(client).clubTeams('12850078')
    ).toEqual({
      error: 'unavailable',
      status: 'failure'
    })
  })

  it('[smartping] reads a pool’s standings and calendar from the division link', async () => {
    const link = {
      auto: '1',
      cx_poule: '300001',
      D1: '200001',
      organisme_pere: '85'
    }
    const { client } = clientAnswering({
      [urlOf('xml_result_equ', { ...link, action: 'classement' })]:
        '<liste><classement><clt>1</clt><equipe>LUCON TT 1</equipe><joue>1</joue><pts>3</pts></classement></liste>',
      [urlOf('xml_result_equ', link)]: '<liste/>'
    })

    const pool = await createSmartpingFederation(client).pool({
      division: '200001',
      organiser: '85',
      pool: '300001'
    })

    expect(pool.status === 'success' && pool.data.standings[0]?.team).toBe(
      'LUCON TT 1'
    )
  })

  it('[smartping] forwards an encounter’s whole link, by the FFTT’s names', async () => {
    const reference = FAKE_POOL.rounds[0]?.fixtures[0]?.encounter

    if (reference === null || reference === undefined) {
      throw new Error('The fake pool’s first fixture has no link')
    }

    const { asked, client } = clientAnswering({})
    await createSmartpingFederation(client).encounter(reference)

    expect(asked[0]?.params).toMatchObject({
      equip_1: reference.homeTeam,
      is_retour: '0',
      renc_id: reference.encounterId
    })
  })

  it('[smartping] searches players in uppercase without accents, this season only', async () => {
    const { asked, client } = clientAnswering({})
    await createSmartpingFederation(client).searchPlayers({
      firstName: 'Inès',
      lastName: 'Berthomé'
    })

    expect(asked[0]?.params).toEqual({
      nom: 'BERTHOME',
      prenom: 'INES',
      valid: '1'
    })
  })
})

describe('the federation the settings call for', () => {
  const ports = {
    cache: () => ({ read: async () => null, write: async () => undefined }),
    fetch: async () => ({
      arrayBuffer: async () => new ArrayBuffer(0),
      status: 200
    }),
    now: () => 0
  }

  it('[smartping] is none without all three secrets, and the fake on SMARTPING_FAKE=1', () => {
    expect(
      federationOf({
        ...ports,
        settings: { SMARTPING_APP_ID: 'SX042', SMARTPING_PASSWORD: 'x' }
      })
    ).toBe(unconfiguredFederation)
    expect(federationOf({ ...ports, settings: { SMARTPING_FAKE: '1' } })).toBe(
      fakeFederation
    )
  })

  it('[smartping] calls the FFTT once the three secrets are set', async () => {
    const urls: string[] = []
    const federation = federationOf({
      ...ports,
      fetch: async (input) => {
        urls.push(input)

        return {
          arrayBuffer: () => new Response('<liste/>').arrayBuffer(),
          status: 200
        }
      },
      settings: {
        SMARTPING_APP_ID: 'SX042',
        SMARTPING_PASSWORD: 'FFTT',
        SMARTPING_SERIAL: 'ABCDEFGHIJ12345'
      }
    })

    expect(await federation.player('8599001')).toEqual({
      data: null,
      status: 'success'
    })
    expect(urls[0]).toContain(
      'xml_licence_b.php?licence=8599001&id=SX042&serie=ABCDEFGHIJ12345'
    )
  })
})
