import { describe, expect, it } from 'vitest'

import { clientMessageSchema } from './client-message'
import { decodeMessage, encodeChecked } from './codec'
import { umpireSnapshotMessageSchema } from './server-message'
import { BEST_OF_5 } from './testing/match-formats'
import { PROTOCOL_VERSION } from './version'

const POINT_ID = '6f1c1d3a-4a8f-4b55-9d6e-0d2f5c1b7a10'
const MATCH_ID = '0b8a1f2e-5c3d-4e6f-8a9b-1c2d3e4f5a6b'

describe('decodeMessage', () => {
  it('[codec] decodes a point scored by an umpire', () => {
    const decoded = decodeMessage(
      clientMessageSchema,
      JSON.stringify({
        event: { id: POINT_ID, side: 'home', type: 'point.scored' },
        matchId: MATCH_ID,
        type: 'match.record'
      })
    )

    expect(decoded.status).toBe('success')
  })

  it('[codec] refuses a frame that is not JSON', () => {
    expect(decodeMessage(clientMessageSchema, '{oops')).toEqual({
      reason: 'frame is not valid JSON',
      status: 'failure'
    })
  })

  it('[codec] refuses an umpire hello with a malformed code', () => {
    const decoded = decodeMessage(
      clientMessageSchema,
      JSON.stringify({
        credentials: { code: 'abc', role: 'umpire' },
        protocolVersion: PROTOCOL_VERSION,
        type: 'hello'
      })
    )

    expect(decoded.status).toBe('failure')
  })

  it('[codec] never echoes the received value in the reason', () => {
    const decoded = decodeMessage(
      clientMessageSchema,
      JSON.stringify({
        credentials: { code: 'SECRET-NAME', role: 'organiser' },
        protocolVersion: PROTOCOL_VERSION,
        type: 'hello'
      })
    )

    expect(decoded.status === 'failure' && decoded.reason).not.toContain(
      'SECRET'
    )
  })
})

describe('encodeChecked', () => {
  it('[codec] drops what the schema does not describe', () => {
    const encoded = encodeChecked(umpireSnapshotMessageSchema, {
      snapshot: {
        event: {
          club: null,
          defaultFormat: BEST_OF_5,
          displays: [],
          encounters: [],
          encounterViews: [],
          generatedAtMs: 0,
          matches: [],
          name: 'Club day',
          players: [],
          startsAtMs: null,
          tableCount: 1,
          tables: [{ matchId: null, number: 1 }],
          teams: []
        },
        log: [],
        table: 1
      },
      type: 'snapshot.umpire',
      ...{ organiserCode: 'ABCDEFGHJKLM' }
    })

    expect(encoded).not.toContain('organiserCode')
  })
})
