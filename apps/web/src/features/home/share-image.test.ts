import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { SHARE_IMAGE } from './share-image'

const PUBLIC_DIRECTORY = resolve(import.meta.dirname, '../../../public')

/** A PNG's IHDR chunk holds its width then its height, big-endian, from byte 16. */
const pngSize = (bytes: Buffer): { height: number; width: number } => ({
  height: bytes.readUInt32BE(20),
  width: bytes.readUInt32BE(16)
})

describe('share image', () => {
  it('ships at the size the page announces', () => {
    const bytes = readFileSync(
      resolve(PUBLIC_DIRECTORY, `.${SHARE_IMAGE.pathname}`)
    )

    expect(pngSize(bytes)).toEqual({
      height: SHARE_IMAGE.height,
      width: SHARE_IMAGE.width
    })
  })
})
