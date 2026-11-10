import { describe, expect, it } from 'vitest'

import {
  decodeSmartpingBytes,
  isSmartpingErrorBody,
  parseSmartpingList
} from './smartping-xml'

const PROLOG = '<?xml version="1.0" encoding="ISO-8859-1"?>'

/** A text as the FFTT sends it in Latin-1: one byte per character. */
const latin1Bytes = (text: string) =>
  Uint8Array.from(text, (character) => character.charCodeAt(0))

describe('reading a Smartping answer', () => {
  it('[smartping] decodes Latin-1 bytes when they are no valid UTF-8', () => {
    const bytes = latin1Bytes(
      `${PROLOG}<liste><x>DÉPARTEMENTALE Luçon</x></liste>`
    )

    expect(decodeSmartpingBytes(bytes)).toContain('DÉPARTEMENTALE Luçon')
  })

  it('[smartping] decodes UTF-8 bytes as UTF-8 though the prolog says Latin-1', () => {
    const bytes = new TextEncoder().encode(
      `${PROLOG}<liste><x>Maëlys</x></liste>`
    )

    expect(decodeSmartpingBytes(bytes)).toContain('Maëlys')
  })

  it('[smartping] reads a single result as a list of one', () => {
    const list = parseSmartpingList(
      `${PROLOG}<liste><club><numero>12859901</numero><nom>PONGISTES DU LAY</nom></club></liste>`,
      ['club']
    )

    expect(list?.club).toEqual([
      { nom: 'PONGISTES DU LAY', numero: '12859901' }
    ])
  })

  it('[smartping] keeps a field named like the repeated element a field', () => {
    const list = parseSmartpingList(
      '<liste><licence><licence>8599001</licence></licence><licence><licence>8599002</licence></licence></liste>',
      ['licence']
    )

    expect(list?.licence).toEqual([
      { licence: '8599001' },
      { licence: '8599002' }
    ])
  })

  it('[smartping] reads an empty list as no items, and a non-list as nothing', () => {
    expect(parseSmartpingList(`${PROLOG}<liste/>`, ['club'])).toEqual({})
    expect(parseSmartpingList('<initialisation/>', ['club'])).toBeNull()
  })

  it('[smartping] keeps a CDATA link whole and escapes a bare ampersand in a name', () => {
    const list = parseSmartpingList(
      '<liste><equipe><libequipe>PING & CO 1</libequipe><liendivision><![CDATA[cx_poule=1&D1=2]]></liendivision></equipe></liste>',
      ['equipe']
    )

    expect(list?.equipe).toEqual([
      { libequipe: 'PING & CO 1', liendivision: 'cx_poule=1&D1=2' }
    ])
  })

  it('[smartping] tells an error body from data', () => {
    expect(
      isSmartpingErrorBody(
        '<?xml version="1.0"?>\n<erreurs><code>400</code><erreur>Vous devez remplir le parametre licence ou club</erreur></erreurs>'
      )
    ).toBe(true)
    expect(isSmartpingErrorBody('<erreur>Compte incorrect</erreur>')).toBe(true)
    expect(
      isSmartpingErrorBody(
        '{"title":"An error occurred","detail":"Internal Server Error"}'
      )
    ).toBe(true)
    expect(isSmartpingErrorBody(`${PROLOG}<liste/>`)).toBe(false)
  })
})
