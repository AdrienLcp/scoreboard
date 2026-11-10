import { describe, expect, it } from 'vitest'

import { encounterOf, setOf } from './smartping-encounter'
import { parseSmartpingList } from './smartping-xml'

const SHEET_TAGS = ['resultat', 'joueur', 'partie']

/** `xml_chp_renc`, shaped as the FFTT's sheets, with invented players and a numbered one. */
const SHEET = `<?xml version="1.0" encoding="ISO-8859-1"?>
<liste>
  <resultat><equa>PPC ANGLES 1</equa><equb>LUCON TT 1</equb><resa>25</resa><resb>17</resb></resultat>
  <joueur><xja>BRIANCEAU   Mathis</xja><xca>M 773pts</xca><xjb>AUVINET Benoît</xjb><xcb>M 543pts</xcb></joueur>
  <joueur><xja>MORINEAU Clara</xja><xca>N°281- F 1560pts</xca><xjb>JOLLY--MERCERON Damien</xjb><xcb>M 500pts</xcb></joueur>
  <joueur><xja>PACAUD Yohann</xja><xca>819</xca><xjb/><xcb/></joueur>
  <partie><ja>BRIANCEAU   Mathis</ja><scorea>2</scorea><jb>AUVINET Benoît</jb><scoreb>1</scoreb><detail>04 04 08</detail></partie>
  <partie><ja>MORINEAU Clara</ja><scorea>1</scorea><jb>JOLLY--MERCERON Damien</jb><scoreb>2</scoreb><detail>-08 -05 11 12 -00</detail></partie>
  <partie><ja>BRIANCEAU Mathis et MORINEAU Clara</ja><scorea>-</scorea><jb>AUVINET Benoît et JOLLY--MERCERON Damien</jb><scoreb>-</scoreb><detail>-</detail></partie>
</liste>`

describe('an encounter’s sheet from xml_chp_renc', () => {
  const encounter = encounterOf(parseSmartpingList(SHEET, SHEET_TAGS) ?? {})

  it('[smartping] reads the result and each side’s players with their sex and points', () => {
    expect(encounter).toMatchObject({
      awayScore: 17,
      awayTeam: 'LUCON TT 1',
      homeScore: 25,
      homeTeam: 'PPC ANGLES 1'
    })
    expect(encounter?.homePlayers).toEqual([
      { name: 'BRIANCEAU Mathis', points: 773, sex: 'M' },
      { name: 'MORINEAU Clara', points: 1560, sex: 'F' },
      { name: 'PACAUD Yohann', points: 819, sex: null }
    ])
    expect(encounter?.awayPlayers).toHaveLength(2)
  })

  it('[smartping] reads each game’s players, points and sets, a double as two names', () => {
    expect(encounter?.games).toEqual([
      {
        awayPlayers: ['AUVINET Benoît'],
        awayPoints: 1,
        homePlayers: ['BRIANCEAU Mathis'],
        homePoints: 2,
        sets: [
          { away: 4, home: 11 },
          { away: 4, home: 11 },
          { away: 8, home: 11 }
        ]
      },
      expect.objectContaining({
        sets: [
          { away: 11, home: 8 },
          { away: 11, home: 5 },
          { away: 11, home: 13 },
          { away: 12, home: 14 },
          { away: 11, home: 0 }
        ]
      }),
      {
        awayPlayers: ['AUVINET Benoît', 'JOLLY--MERCERON Damien'],
        awayPoints: null,
        homePlayers: ['BRIANCEAU Mathis', 'MORINEAU Clara'],
        homePoints: null,
        sets: []
      }
    ])
  })

  it('[smartping] sums the games when the sheet’s score is empty', () => {
    const withoutScore = SHEET.replace('<resa>25</resa>', '<resa/>')

    expect(
      encounterOf(parseSmartpingList(withoutScore, SHEET_TAGS) ?? {})?.homeScore
    ).toBe(3)
  })

  it('[smartping] has no sheet before the encounter', () => {
    expect(
      encounterOf(parseSmartpingList('<liste/>', SHEET_TAGS) ?? {})
    ).toBeNull()
  })

  it('[smartping] reads a set lost to love from its sign, not its value', () => {
    expect(setOf('-00')).toEqual({ away: 11, home: 0 })
    expect(setOf('00')).toEqual({ away: 0, home: 11 })
    expect(setOf('-')).toBeNull()
  })
})
