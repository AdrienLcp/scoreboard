import { readFileSync } from 'node:fs'

import { findContrastFailures, WCAG_AA } from '@adrienlcp/styles/contrast'
import { describe, expect, it } from 'vitest'

const TOKENS = readFileSync(new URL('_tokens.sass', import.meta.url), 'utf8')

const SURFACES = [
  '--field',
  '--surface',
  '--surface-raised',
  '--surface-high'
] as const
const TEXT_INKS = ['--ink', '--ink-muted', '--ink-dim', '--live'] as const

describe('colour tokens', () => {
  it('[contrast] every ink reads on every surface', () => {
    expect(
      findContrastFailures(TOKENS, [
        ...SURFACES.flatMap((background) => [
          ...TEXT_INKS.map((foreground) => ({
            background,
            foreground,
            minimum: WCAG_AA.text
          })),
          { background, foreground: '--focus', minimum: WCAG_AA.nonText }
        ]),
        {
          background: '--live',
          foreground: '--on-live',
          minimum: WCAG_AA.text
        },
        { background: '--ink', foreground: '--on-ink', minimum: WCAG_AA.text },
        {
          background: '--qr-paper',
          foreground: '--qr-ink',
          minimum: WCAG_AA.nonText
        }
      ])
    ).toEqual([])
  })
})
