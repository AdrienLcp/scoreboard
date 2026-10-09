import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { REACT_ARIA_TOKENS } from '@adrienlcp/react-aria'
import {
  findFallbackFailures,
  findTokenFailures,
  findTypeLiterals,
  findUnitFailures,
  findUnnamedValues,
  webFontFamilies
} from '@adrienlcp/styles/audit'
import { describe, expect, it } from 'vitest'

const SOURCE = fileURLToPath(new URL('../..', import.meta.url))
const STYLESHEETS = globSync('**/*.{sass,css}', { cwd: SOURCE })
const SOURCES = globSync('**/*.{sass,css,ts,tsx}', { cwd: SOURCE }).map(
  (path) => readFileSync(join(SOURCE, path), 'utf8')
)
const WEB_FONTS = webFontFamilies(
  STYLESHEETS.map((path) => readFileSync(join(SOURCE, path), 'utf8'))
)

describe.each(STYLESHEETS)('%s', (path) => {
  const stylesheet = readFileSync(join(SOURCE, path), 'utf8')

  it('sizes text, spacing and boxes in rem', () => {
    expect(findUnitFailures(stylesheet)).toEqual([])
  })

  it.skipIf(path.endsWith('_typography.sass'))(
    'takes its text voice from the typography mixins',
    () => {
      expect(findTypeLiterals(stylesheet)).toEqual([])
    }
  )

  it('takes its radii and durations from tokens', () => {
    expect(findUnnamedValues(stylesheet)).toEqual([])
  })

  it('names the fallback face after every web font in a font token', () => {
    expect(findFallbackFailures(stylesheet, WEB_FONTS)).toEqual([])
  })
})

it('reads only custom properties that exist, under their one shared name', () => {
  expect(findTokenFailures(SOURCES, { provided: REACT_ARIA_TOKENS })).toEqual(
    []
  )
})
