import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { connectedScreensOf } from './connected-screens'

const HALL_B = randomUUID()

describe('connectedScreensOf', () => {
  it('[session] counts the TVs on each screen, the one showing every table included', () => {
    expect(
      connectedScreensOf([
        { displayId: null, role: 'display' },
        { displayId: HALL_B, role: 'display' },
        { displayId: HALL_B, role: 'display' }
      ])
    ).toEqual([
      { displayId: null, tvCount: 1 },
      { displayId: HALL_B, tvCount: 2 }
    ])
  })

  it('[session] counts no screen for the other roles, a socket not yet admitted, or a display that did not say', () => {
    expect(
      connectedScreensOf([
        null,
        { role: 'display' },
        { role: 'spectator' },
        { role: 'organiser' },
        { role: 'umpire', table: 1 }
      ])
    ).toEqual([])
  })
})
