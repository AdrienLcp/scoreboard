import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { matchOn, setupWith } from '@scoreboard/protocol/testing/event-setups'

import { checkEventSetup } from '@scoreboard/core/event/event-setup-check'

import {
  draftPoolsOf,
  type TournamentClub,
  toggleClub,
  tournamentDraftFor,
  withDrawFor,
  withoutTournament,
  withTournament
} from './tournament-edits'

const LABELS = {
  final: 'Final',
  poolMatch: (_: unknown, home: number, away: number) => `${home}-${away}`,
  semiFinal: (slot: 1 | 2) => `Semi-final ${slot}`,
  thirdPlace: 'Third place'
}

const clubOf = (name: string): TournamentClub => {
  const id = randomUUID()

  return {
    colour: null,
    id,
    logoUrl: null,
    name,
    players: [900, 800, 700].map((points) => ({
      id: randomUUID(),
      licence: null,
      name: `${name} ${points}`,
      points,
      teamId: id
    }))
  }
}

const CLUBS = ['A', 'B', 'C', 'D', 'E', 'F'].map(clubOf)

const draftWithEveryClub = (setup = setupWith([matchOn(1)])) =>
  CLUBS.reduce(
    (draft, club) => toggleClub({ club, draft }),
    tournamentDraftFor(setup)
  )

describe('tournament edits', () => {
  it('[top-12] enters a picked club with its two best players', () => {
    const [club] = CLUBS
    const draft =
      club === undefined
        ? null
        : toggleClub({ club, draft: tournamentDraftFor(setupWith([])) })

    expect(draft?.playerIds).toEqual(
      club?.players.slice(0, 2).map((player) => player.id)
    )
  })

  it('[top-12] seeds two pools of six without clubmates together', () => {
    const pools = draftPoolsOf({ clubs: CLUBS, draft: draftWithEveryClub() })
    const clubsIn = (pool: readonly string[]) =>
      pool.map(
        (playerId) =>
          CLUBS.find((club) =>
            club.players.some((player) => player.id === playerId)
          )?.id
      )

    expect(pools.map((pool) => pool.length)).toEqual([6, 6])
    expect(pools.every((pool) => new Set(clubsIn(pool)).size === 6)).toBe(true)
  })

  it('[top-12] builds a day the server accepts, keeping its other matches', () => {
    const setup = setupWith([matchOn(1)], { tableCount: 8 })
    const built = withTournament({
      clubs: CLUBS,
      draft: draftWithEveryClub(setup),
      labels: LABELS,
      newMatchId: randomUUID,
      poolName: String,
      setup
    })

    expect(checkEventSetup(built).status).toBe('success')
    expect(built.matches).toHaveLength(1 + 15 * 2 + 3)
    expect(new Set(built.teams.map((team) => team.colour)).size).toBe(6)
    expect(
      new Set(
        built.matches.flatMap((match) =>
          match.stage?.kind === 'pool' ? [match.table] : []
        )
      )
    ).toEqual(new Set([1, 2, 3, 4, 5, 6]))
    expect(withoutTournament(built).matches).toEqual(setup.matches)
  })

  it('[top-12] draws one tied group and keeps the other groups’ draws', () => {
    const [first, second, third, fourth] = ['p1', 'p2', 'p3', 'p4']
    const setup = {
      ...setupWith([]),
      tournament: {
        drawOrder: [first, second, third, fourth],
        lossPoints: 1,
        pools: [
          { id: 'A', name: '1', playerIds: [first, second] },
          { id: 'B', name: '2', playerIds: [third, fourth] }
        ],
        winPoints: 2
      }
    }
    const drawn = withDrawFor({
      playerIds: [third, fourth],
      random: (() => {
        const keys = [0.9, 0.1]

        return () => keys.shift() ?? 0
      })(),
      setup
    })

    expect(drawn.tournament?.drawOrder).toEqual([first, second, fourth, third])
  })
})
