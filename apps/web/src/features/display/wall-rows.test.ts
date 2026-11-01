import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { MatchSetup, Team } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { StampedEvent } from '@scoreboard/protocol/scoring-event'
import { matchOn, setupWith } from '@scoreboard/protocol/testing/event-setups'
import { aPlayer } from '@scoreboard/protocol/testing/players'
import {
  card,
  stampedAt,
  started,
  walkover
} from '@scoreboard/protocol/testing/scoring-events'

import { publicSnapshotFor } from '@scoreboard/core/event/public-snapshot'

import { wallCallOf } from '@/features/event/sheet-call'
import { wallSideOf } from '@/features/event/sheet-side'

import { LINGER_MS } from './display-stage'
import { wallRowsFor } from './wall-rows'

const ANNA = aPlayer('Anna Morel')
const BRUNO = aPlayer('Bruno Garnier')
const XAVIER = aPlayer('Xavier Martin')
const YVES = aPlayer('Yves Blanc')
const HOME: Team = { colour: '#007A42', id: randomUUID(), name: 'Angles 4' }
const AWAY: Team = { colour: null, id: randomUUID(), name: 'Nantes 2' }
const ENCOUNTER_ID = randomUUID()

const sheetLine = (
  table: number,
  label: string,
  home: string[],
  away: string[]
): MatchSetup =>
  matchOn(table, {
    away: { playerIds: away },
    encounterId: ENCOUNTER_ID,
    home: { playerIds: home },
    label
  })

const AX = sheetLine(1, 'AX', [ANNA.id], [XAVIER.id])
const BY = sheetLine(2, 'BY', [BRUNO.id], [YVES.id])
const AY = sheetLine(1, 'AY', [ANNA.id], [YVES.id])
const DOUBLE = sheetLine(
  2,
  'Double 1',
  [ANNA.id, BRUNO.id],
  [XAVIER.id, YVES.id]
)

const snapshotWith = (
  logs: [MatchSetup, StampedEvent[]][],
  matches: MatchSetup[] = [AX, BY, AY, DOUBLE]
) =>
  publicSnapshotFor({
    logs: new Map(logs.map(([match, log]) => [match.id, log])),
    nowMs: 1000,
    setup: setupWith(matches, {
      encounters: [
        {
          away: AWAY.id,
          formatId: 'fftt-6-players-20-games',
          home: HOME.id,
          id: ENCOUNTER_ID,
          matchPoints: 'one-per-win'
        }
      ],
      players: [ANNA, BRUNO, XAVIER, YVES],
      teams: [HOME, AWAY]
    })
  })

const viewOf = (
  snapshot: ReturnType<typeof snapshotWith>,
  match: MatchSetup
): MatchView => {
  const view = snapshot.matches.find((candidate) => candidate.id === match.id)

  if (view === undefined) {
    throw new Error(`no view for ${match.label}`)
  }

  return view
}

describe('wall rows', () => {
  it('[wall] puts an encounter on one row with its two tables, the opponent white by default', () => {
    const rows = wallRowsFor({
      nowMs: 1000,
      snapshot: snapshotWith([[AX, [stampedAt(1, started())]]]),
      tables: [1, 2]
    })

    expect(rows?.map((row) => row.tables.map((table) => table.table))).toEqual([
      [1, 2]
    ])
    expect(rows?.[0]?.away).toMatchObject({ colour: '#FFFFFF', isWhite: true })
    expect(rows?.[0]?.home.textColour).toBe('#FFFFFF')
    expect(rows?.[0]?.tables[1]?.next?.id).toBe(BY.id)
  })

  it('[wall] leaves a table with a match outside any encounter to the open board', () => {
    expect(
      wallRowsFor({
        nowMs: 1000,
        snapshot: snapshotWith([], [AX, matchOn(2)]),
        tables: [1, 2]
      })
    ).toBeNull()
  })

  it('[wall] holds a finished match on its table until the room has read its final score', () => {
    const snapshot = snapshotWith([
      [AX, [stampedAt(1, started()), stampedAt(3, walkover())]]
    ])
    const tableOneAt = (nowMs: number) =>
      wallRowsFor({ nowMs, snapshot, tables: [1, 2] })?.[0]?.tables[0]

    expect(tableOneAt(3 + LINGER_MS - 1)).toMatchObject({
      isOver: true,
      live: { id: AX.id }
    })
    expect(tableOneAt(3 + LINGER_MS)).toMatchObject({
      isOver: false,
      live: null,
      next: { id: AY.id }
    })
  })

  it('[wall] calls a singles line by its letters and a double by its label', () => {
    expect([
      wallCallOf(viewOf(snapshotWith([]), AX)),
      wallCallOf(viewOf(snapshotWith([]), DOUBLE))
    ]).toEqual(['A – X', 'Double 1'])
  })

  it('[wall] carries a card into the player’s next match and letters a double from the singles', () => {
    const shown = card({ playerId: ANNA.id, side: 'home' })
    const snapshot = snapshotWith([
      [
        AX,
        [stampedAt(1, started()), stampedAt(2, shown), stampedAt(3, walkover())]
      ],
      [AY, [stampedAt(4, started())]],
      [DOUBLE, [stampedAt(5, started())]]
    ])
    const matches = snapshot.matches
    const sideIn = (match: MatchSetup) =>
      wallSideOf({
        match: viewOf(snapshot, match),
        matches,
        players: snapshot.players,
        side: 'home'
      })

    expect(sideIn(AY)).toMatchObject({ card: 0, letters: 'A' })
    expect(sideIn(DOUBLE)).toMatchObject({ card: 0, letters: 'AB' })
    expect(sideIn(DOUBLE).players.map((player) => player.card)).toEqual([
      0,
      null
    ])
    expect(sideIn(DOUBLE).sideCard).toBeNull()
    expect(
      wallSideOf({
        match: viewOf(snapshot, DOUBLE),
        matches,
        players: snapshot.players,
        side: 'away'
      })
    ).toMatchObject({ card: null, letters: 'XY' })
  })
})
