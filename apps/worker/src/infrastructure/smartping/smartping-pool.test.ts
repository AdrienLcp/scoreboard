import { describe, expect, it } from 'vitest'

import { roundsOf, standingsOf } from './smartping-pool'
import { parseSmartpingList } from './smartping-xml'

/** `xml_result_equ` with no action: one encounter played, one to come, one bye. */
const CALENDAR = `<?xml version="1.0" encoding="ISO-8859-1"?><liste>
<tour><libelle>Poule A - tour n°1 du 19/09/2026</libelle><equa>PPC ANGLES (1)</equa><equb>LUCON TT (1)</equb><scorea>8</scorea><scoreb>6</scoreb><lien><![CDATA[renc_id=400001&is_retour=0&phase=1&res_1=8&res_2=6&equip_1=PPC+ANGLES+%281%29&equip_2=LUCON+TT+%281%29&equip_id1=9001&equip_id2=9011&clubnum_1=12850078&clubnum_2=12850097]]></lien><dateprevue>19/09/2026</dateprevue><datereelle>19/09/2026</datereelle></tour>
<tour><libelle>Poule A - tour n°2 du 03/10/2026</libelle><equa>LUCON TT (1)</equa><equb>LAY (1)</equb><scorea/><scoreb/><lien><![CDATA[renc_id=400011&is_retour=0&phase=1&res_1=&res_2=&equip_1=LUCON+TT+%281%29&equip_2=LAY+%281%29&equip_id1=9011&equip_id2=9021&clubnum_1=12850097&clubnum_2=12859901]]></lien><dateprevue>03/10/2026</dateprevue><datereelle/></tour>
<tour><libelle>Poule A - tour n°2 du 03/10/2026</libelle><equa>PPC ANGLES (1)</equa><equb/><scorea/><scoreb/><lien/><dateprevue>03/10/2026</dateprevue><datereelle/></tour>
</liste>`

describe('a pool’s calendar from xml_result_equ', () => {
  const rounds = roundsOf(parseSmartpingList(CALENDAR, ['tour'])?.tour ?? [])

  it('[smartping] groups encounters by round, dated in ISO, with their scores and sheet link', () => {
    expect(rounds[0]).toEqual({
      date: '2026-09-19',
      fixtures: [
        {
          awayClubNumber: '12850097',
          awayScore: 6,
          awayTeam: 'LUCON TT (1)',
          encounter: {
            awayClubNumber: '12850097',
            awayScore: '6',
            awayTeam: 'LUCON TT (1)',
            awayTeamId: '9011',
            encounterId: '400001',
            homeClubNumber: '12850078',
            homeScore: '8',
            homeTeam: 'PPC ANGLES (1)',
            homeTeamId: '9001',
            isReturn: '0',
            phase: '1'
          },
          homeClubNumber: '12850078',
          homeScore: 8,
          homeTeam: 'PPC ANGLES (1)'
        }
      ],
      number: 1
    })
  })

  it('[smartping] leaves the scores empty before play and a bye out', () => {
    expect(rounds[1]?.fixtures).toEqual([
      expect.objectContaining({
        awayScore: null,
        homeScore: null,
        homeTeam: 'LUCON TT (1)'
      })
    ])
  })
})

describe('a pool’s standings from xml_result_equ&action=classement', () => {
  it('[smartping] gives a tied row the rank above, and reads `classement` where `clt` is missing', () => {
    const xml = `<?xml version="1.0" encoding="ISO-8859-1"?><liste>
<classement><poule>Poule A</poule><clt>1</clt><equipe>LUCON TT 1</equipe><joue>4</joue><pts>12</pts><numero>12850097</numero><totvic>4</totvic><totdef>0</totdef><idequipe>9011</idequipe><idclub>1</idclub><vic>4</vic><def>0</def><nul>0</nul><pf>0</pf><pg>40</pg><pp>16</pp></classement>
<classement><poule>Poule A</poule><clt>-</clt><equipe>PPC ANGLES 1</equipe><joue>4</joue><pts>12</pts><numero>12850078</numero><idequipe>9001</idequipe><pg>38</pg><pp>18</pp></classement>
<classement><poule>Poule A</poule><classement>3</classement><equipe>LAY 1</equipe><joue>4</joue><pts>8</pts><numero>12859901</numero><idequipe/><pg/><pp/></classement>
<classement><poule>Poule A</poule><clt>4</clt><equipe/></classement>
</liste>`

    expect(
      standingsOf(parseSmartpingList(xml, ['classement'])?.classement ?? [])
    ).toEqual([
      {
        clubNumber: '12850097',
        gamesLost: 16,
        gamesWon: 40,
        played: 4,
        points: 12,
        rank: 1,
        team: 'LUCON TT 1',
        teamId: '9011'
      },
      expect.objectContaining({ rank: 1, team: 'PPC ANGLES 1' }),
      expect.objectContaining({
        gamesWon: null,
        rank: 3,
        team: 'LAY 1',
        teamId: null
      })
    ])
  })
})
