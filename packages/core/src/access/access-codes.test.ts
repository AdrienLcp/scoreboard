import { describe, expect, it } from 'vitest'

import { countingCode } from '../testing/counting-code'
import {
  newOrganiserCode,
  parseUmpireCode,
  tableAccessesFor
} from './access-codes'

describe('parseUmpireCode', () => {
  it('[access] forgives case, spaces and hyphens', () => {
    expect(parseUmpireCode(' abc-def ')).toBe('ABCDEF')
  })

  it('[access] refuses letters a code never holds', () => {
    expect(parseUmpireCode('ABCDE0')).toBeNull()
  })
})

describe('newOrganiserCode', () => {
  it('[access] draws twelve characters from the code alphabet', () => {
    expect(newOrganiserCode(countingCode())).toBe('ABCDEFGHJKLM')
  })
})

describe('tableAccessesFor', () => {
  it('[access] keeps the code of a table that stays', () => {
    const existing = [{ code: 'ZZZZZZ', table: 1 }]

    expect(
      tableAccessesFor({
        drawCode: countingCode(),
        existing,
        tableCount: 2
      })
    ).toEqual([
      { code: 'ZZZZZZ', table: 1 },
      { code: 'ABCDEF', table: 2 }
    ])
  })

  it('[access] drops the codes of tables removed', () => {
    const existing = [
      { code: 'ZZZZZZ', table: 1 },
      { code: 'YYYYYY', table: 2 }
    ]

    expect(
      tableAccessesFor({
        drawCode: countingCode(),
        existing,
        tableCount: 1
      })
    ).toEqual([{ code: 'ZZZZZZ', table: 1 }])
  })

  it('[access] never hands two tables the same code', () => {
    const draws = ['AAAAAA', 'BBBBBB']
    const scripted = () => draws.shift() ?? ''

    expect(
      tableAccessesFor({
        drawCode: scripted,
        existing: [{ code: 'AAAAAA', table: 1 }],
        tableCount: 2
      })
    ).toEqual([
      { code: 'AAAAAA', table: 1 },
      { code: 'BBBBBB', table: 2 }
    ])
  })
})
