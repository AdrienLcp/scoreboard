import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { md5Hex } from './md5'
import {
  drawSmartpingSerial,
  signSmartpingTimestamp,
  smartpingKeyOf,
  smartpingTimestampOf
} from './smartping-signature'

/** 2015-06-11 12:00:22.081 UTC, 14:00:22.081 in Paris (summer time): the spec's worked example. */
const SPEC_EXAMPLE_INSTANT_MS = 1_434_024_022_081

/** 2026-01-15 08:30:05.007 UTC, 09:30:05.007 in Paris (winter time). */
const WINTER_INSTANT_MS = 1_768_465_805_007

describe('the Smartping signature', () => {
  it('[smartping] hashes like any MD5, across one and several blocks', () => {
    const texts = [
      '',
      'FFTT',
      'Côme',
      'x'.repeat(55),
      'y'.repeat(56),
      'z'.repeat(200)
    ]

    for (const text of texts) {
      expect(md5Hex(text)).toBe(createHash('md5').update(text).digest('hex'))
    }
  })

  it('[smartping] keys the HMAC with the password’s MD5 as text, as the spec’s example', async () => {
    const key = smartpingKeyOf('FFTT')

    expect(key).toBe('fbcbfc973284726ab5a53ac296927cc6')
    expect(await signSmartpingTimestamp(key, '20150611140022081')).toBe(
      '517b27013dd619db47f2bf4c50ae504acbb33980'
    )
  })

  it('[smartping] stamps the time in Paris, summer or winter, to the millisecond', () => {
    expect(smartpingTimestampOf(SPEC_EXAMPLE_INSTANT_MS)).toBe(
      '20150611140022081'
    )
    expect(smartpingTimestampOf(WINTER_INSTANT_MS)).toBe('20260115093005007')
  })

  it('[smartping] draws a 15-character serial from A–Z and 0–9, skipping the bytes that would bias it', () => {
    const bytes = [255, 0, 25, 26, 35, 252, 36, 71, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    let drawn = 0
    const serial = drawSmartpingSerial((count) => {
      const batch = Uint8Array.from(bytes.slice(drawn, drawn + count))
      drawn += count

      return batch
    })

    expect(serial).toBe('AZ09A9BCDEFGHIJ')
  })
})
