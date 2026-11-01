import { randomUUID } from 'node:crypto'

import type { Player } from '../event-setup'

export const aPlayer = (name: string): Player => ({
  id: randomUUID(),
  licence: null,
  name,
  points: null,
  teamId: null
})

export const CAMILLE = aPlayer('Camille')
export const LOUIS = aPlayer('Louis')
