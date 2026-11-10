import { describe, expect, it } from 'vitest'

import { playersOfLicences, playersOfSpidList } from './smartping-players'
import { parseSmartpingList } from './smartping-xml'

/** `xml_licence_b?club=…`, shaped as the FFTT's answers, with invented licensees. */
const CLUB_LICENCES = `<?xml version="1.0" encoding="ISO-8859-1"?>
<liste><licence><idlicence>1100001</idlicence><licence>8599001</licence><nom>BRIANCEAU</nom><prenom>Mathis</prenom><numclub>12850078</numclub><nomclub>PING PONG CLUB ANGLOIS</nomclub><sexe>M</sexe><type>T</type><certif>U</certif><validation>12/07/2026</validation><echelon></echelon><place/><point>1328</point><cat>J3</cat><pointm>1368.629882813</pointm><apointm>1360.63</apointm><initm>1328</initm><mutation>01/07/2026</mutation><natio>F</natio><arb/><ja/><tech/></licence><licence><idlicence>1100002</idlicence><licence>8599002</licence><nom>GUILLOTEAU</nom><prenom>Sébastien</prenom><numclub>12850078</numclub><nomclub>PING PONG CLUB ANGLOIS</nomclub><sexe>M</sexe><type>T</type><certif>A</certif><validation>01/08/2026</validation><echelon>N</echelon><place>5</place><point>3508</point><cat>S</cat><pointm>28</pointm><apointm>3508</apointm><initm>3453</initm><mutation/><natio>E</natio><arb/><ja/><tech/></licence><licence><idlicence>1100003</idlicence><licence>8599003</licence><nom>MORINEAU</nom><prenom>Clara</prenom><numclub>12850078</numclub><nomclub>PING PONG CLUB ANGLOIS</nomclub><sexe>F</sexe><type>I</type><certif>C</certif><validation>12/07/2026</validation><echelon></echelon><place/><point>970</point><cat></cat><pointm>970</pointm><apointm>965.5</apointm><initm>975.</initm><mutation/><natio></natio><arb/><ja/><tech/></licence><licence><licence>not-a-licence</licence><nom>BROKEN</nom></licence></liste>`

describe('the licensees of xml_licence_b', () => {
  it('[smartping] reads official and monthly points, sex, category and club', () => {
    const players = playersOfLicences(
      parseSmartpingList(CLUB_LICENCES, ['licence'])?.licence ?? []
    )

    expect(players[0]).toEqual({
      category: 'J3',
      clubName: 'PING PONG CLUB ANGLOIS',
      clubNumber: '12850078',
      firstName: 'Mathis',
      lastName: 'BRIANCEAU',
      licence: '8599001',
      monthlyPoints: 1369,
      points: 1328,
      sex: 'M'
    })
  })

  it('[smartping] drops monthly points below the scale’s floor, as a numbered player’s can be', () => {
    const players = playersOfLicences(
      parseSmartpingList(CLUB_LICENCES, ['licence'])?.licence ?? []
    )

    expect(players[1]).toMatchObject({ monthlyPoints: null, points: 3508 })
  })

  it('[smartping] reads an empty category as none, and leaves a malformed licensee out', () => {
    const players = playersOfLicences(
      parseSmartpingList(CLUB_LICENCES, ['licence'])?.licence ?? []
    )

    expect(players).toHaveLength(3)
    expect(players[2]).toMatchObject({ category: null, sex: 'F' })
  })

  it('[smartping] reads one licensee alone as a list of one', () => {
    const one = `<?xml version="1.0" encoding="ISO-8859-1"?><liste><licence><licence>8599101</licence><nom>AUVINET</nom><prenom>Benoît</prenom><numclub>12850097</numclub><nomclub>LUCON TENNIS DE TABLE</nomclub><sexe>M</sexe><point>1520</point><cat>V40</cat><pointm>1532.1</pointm></licence></liste>`

    expect(
      playersOfLicences(parseSmartpingList(one, ['licence'])?.licence ?? [])
    ).toEqual([expect.objectContaining({ licence: '8599101', points: 1520 })])
  })
})

describe('the licensees of xml_liste_joueur_o', () => {
  it('[smartping] reads the club’s number from `club` and its name from `nclub`', () => {
    const list = `<?xml version="1.0" encoding="ISO-8859-1"?><liste><joueur><licence>8599102</licence><nom>BERTHOMÉ</nom><prenom>Lucas</prenom><club>12850097</club><nclub>LUCON TENNIS DE TABLE</nclub><sexe>M</sexe><echelon></echelon><place/><points>571</points></joueur><joueur><licence>8599103</licence><nom>COUSSEAU</nom><prenom>Inès</prenom><club>12850097</club><nclub>LUCON TENNIS DE TABLE</nclub><sexe>F</sexe><echelon>N</echelon><place>281</place><points>1560</points></joueur></liste>`

    expect(
      playersOfSpidList(parseSmartpingList(list, ['joueur'])?.joueur ?? [])
    ).toEqual([
      {
        category: null,
        clubName: 'LUCON TENNIS DE TABLE',
        clubNumber: '12850097',
        firstName: 'Lucas',
        lastName: 'BERTHOMÉ',
        licence: '8599102',
        monthlyPoints: null,
        points: 571,
        sex: 'M'
      },
      expect.objectContaining({ licence: '8599103', points: 1560, sex: 'F' })
    ])
  })
})
