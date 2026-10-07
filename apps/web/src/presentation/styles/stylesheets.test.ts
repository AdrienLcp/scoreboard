import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { findTypeLiterals, findUnitFailures } from '@adrienlcp/styles/audit'
import { describe, expect, it } from 'vitest'

const SOURCE = fileURLToPath(new URL('../..', import.meta.url))
const STYLESHEETS = globSync('**/*.{sass,css}', { cwd: SOURCE })

describe.each(STYLESHEETS)('%s', (path) => {
  const stylesheet = readFileSync(join(SOURCE, path), 'utf8')

  it('sizes text and spacing in rem', () => {
    expect(findUnitFailures(stylesheet)).toEqual([])
  })

  it.skipIf(path.endsWith('_typography.sass'))(
    'takes its text voice from the typography mixins',
    () => {
      expect(findTypeLiterals(stylesheet)).toEqual([])
    }
  )
})
