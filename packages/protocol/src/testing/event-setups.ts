import { randomUUID } from 'node:crypto'

import type { EventSetup, MatchSetup } from '../event-setup'
import { BEST_OF_3 } from './match-formats'
import { CAMILLE, LOUIS } from './players'

/** A singles match between {@link CAMILLE} at home and {@link LOUIS} away. */
export const matchOn = (
  table: number | null,
  overrides: Partial<MatchSetup> = {}
): MatchSetup => ({
  away: { playerIds: [LOUIS.id] },
  encounterId: null,
  format: BEST_OF_3,
  home: { playerIds: [CAMILLE.id] },
  id: randomUUID(),
  label: null,
  plannedAtMs: null,
  table,
  ...overrides
})

/** An individual event on four tables whose players are {@link CAMILLE} and {@link LOUIS}. */
export const setupWith = (
  matches: MatchSetup[],
  overrides: Partial<EventSetup> = {}
): EventSetup => ({
  club: null,
  defaultFormat: BEST_OF_3,
  displays: [],
  encounters: [],
  matches,
  name: 'Club day',
  players: [CAMILLE, LOUIS],
  startsAtMs: null,
  tableCount: 4,
  teams: [],
  ...overrides
})
