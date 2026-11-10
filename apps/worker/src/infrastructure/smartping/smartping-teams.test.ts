import { describe, expect, it } from 'vitest'

import { clubsOf } from './smartping-clubs'
import { teamsOf } from './smartping-teams'
import { parseSmartpingList } from './smartping-xml'

describe('the teams of xml_equipe', () => {
  it('[smartping] splits the phase off the label and reads the pool from the division link', () => {
    const xml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<liste><equipe><idepr>8985</idepr><libepr>FED_Championnat de France par Equipes Masculin</libepr><idequipe>9001</idequipe><libequipe>PPC ANGLES 1 - Phase 1</libequipe><libdivision>D85_DÉPARTEMENTALE_1_Ph1 Poule A</libdivision><liendivision><![CDATA[cx_poule=300001&D1=200001&organisme_pere=85]]></liendivision></equipe><equipe><idepr>8985</idepr><libepr>Coupe départementale</libepr><idequipe>9003</idequipe><libequipe>PPC ANGLES 3</libequipe><libdivision>Coupe</libdivision><liendivision/></equipe></liste>`

    expect(teamsOf(parseSmartpingList(xml, ['equipe'])?.equipe ?? [])).toEqual([
      {
        competition: 'FED_Championnat de France par Equipes Masculin',
        division: 'D85_DÉPARTEMENTALE_1_Ph1 Poule A',
        id: '9001',
        name: 'PPC ANGLES 1',
        phase: 1,
        pool: { division: '200001', organiser: '85', pool: '300001' }
      },
      {
        competition: 'Coupe départementale',
        division: 'Coupe',
        id: '9003',
        name: 'PPC ANGLES 3',
        phase: null,
        pool: null
      }
    ])
  })
})

describe('the clubs of xml_club_b and xml_club_dep2', () => {
  it('[smartping] keeps the club number’s leading zeros and leaves a malformed club out', () => {
    const xml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<liste><club><idclub>23370002</idclub><numero>04370002</numero><nom>TT  DE   LA FORÊT</nom><validation>06/07/2026</validation><typeclub>L</typeclub></club><club><idclub>1</idclub><numero>123</numero><nom>TOO SHORT</nom></club></liste>`

    expect(clubsOf(parseSmartpingList(xml, ['club'])?.club ?? [])).toEqual([
      { name: 'TT DE LA FORÊT', number: '04370002' }
    ])
  })
})
