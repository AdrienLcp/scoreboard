import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { Player, Team } from '@scoreboard/protocol/event-setup'
import { matchOn, setupWith } from '@scoreboard/protocol/testing/event-setups'
import { BEST_OF_5 } from '@scoreboard/protocol/testing/match-formats'
import type { Pool } from '@scoreboard/protocol/tournament'

import { publicSnapshotFor } from '@scoreboard/core/event/public-snapshot'
import { tournamentMatchesFor } from '@scoreboard/core/tournament/tournament-setup'

import { wallTournamentFor } from './wall-tournament'

const CLUBS: Team[] = ['#8FCBEF', '#F4A259', '#007A42'].map(
  (colour, index) => ({
    colour,
    id: randomUUID(),
    name: `Club ${index + 1}`
  })
)

const PLAYERS: Player[] = Array.from({ length: 6 }, (_, index) => ({
  id: randomUUID(),
  licence: null,
  name: `Player ${index + 1}`,
  points: 1500 - index * 10,
  teamId: CLUBS[index % CLUBS.length]?.id ?? null
}))

const POOLS: Pool[] = [
  { id: 'pool-1', name: '1', playerIds: PLAYERS.slice(0, 3).map((p) => p.id) },
  { id: 'pool-2', name: '2', playerIds: PLAYERS.slice(3).map((p) => p.id) }
]

const MATCHES = tournamentMatchesFor({
  firstTable: 1,
  format: BEST_OF_5,
  hasThirdPlace: false,
  labels: {
    final: 'Final',
    poolMatch: (_, home, away) => `${home}-${away}`,
    semiFinal: (slot) => `Semi-final ${slot}`,
    thirdPlace: 'Third place'
  },
  newMatchId: randomUUID,
  pools: POOLS
})

const snapshotWith = (overrides: Parameters<typeof setupWith>[1] = {}) =>
  publicSnapshotFor({
    logs: new Map(),
    nowMs: 1000,
    setup: setupWith(MATCHES, {
      players: PLAYERS,
      tableCount: 2,
      teams: CLUBS,
      tournament: { drawOrder: [], lossPoints: 1, pools: POOLS, winPoints: 2 },
      ...overrides
    })
  })

describe('wallTournamentFor', () => {
  it('[wall] gives each pool its row, its players on their clubs’ colours', () => {
    const rows = wallTournamentFor({
      nowMs: 1000,
      snapshot: snapshotWith(),
      tables: [1, 2]
    })
    const [first] = rows ?? []

    expect(rows?.map((row) => row.id)).toEqual(['pool-1', 'pool-2'])
    expect(
      first?.kind === 'pool'
        ? first.standings.map((standing) => standing.paint.colour)
        : []
    ).toEqual(['#8FCBEF', '#F4A259', '#007A42'])
  })

  it('[wall] leaves a day without a tournament to the other boards', () => {
    expect(
      wallTournamentFor({
        nowMs: 1000,
        snapshot: snapshotWith({ matches: [matchOn(1)], tournament: null }),
        tables: [1]
      })
    ).toBeNull()
  })
})
