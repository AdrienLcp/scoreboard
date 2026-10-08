import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  findTokenFailures,
  findTypeLiterals,
  findUnitFailures,
  findUnnamedValues
} from '@adrienlcp/styles/audit'
import { describe, expect, it } from 'vitest'

const SOURCE = fileURLToPath(new URL('../..', import.meta.url))
const STYLESHEETS = globSync('**/*.{sass,css}', { cwd: SOURCE })
const SOURCES = globSync('**/*.{sass,css,ts,tsx}', { cwd: SOURCE }).map(
  (path) => readFileSync(join(SOURCE, path), 'utf8')
)

/**
 * Set at runtime by react-aria on a popover's style, so no app source declares
 * it: `findTokenFailures` cannot tell it from a typo.
 */
const SET_BY_REACT_ARIA = new Set(['--trigger-width'])

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
})

it('reads only custom properties that exist, under their one shared name', () => {
  const failures = findTokenFailures(SOURCES).filter(
    ({ name }) => !SET_BY_REACT_ARIA.has(name)
  )

  expect(failures).toEqual([])
})
