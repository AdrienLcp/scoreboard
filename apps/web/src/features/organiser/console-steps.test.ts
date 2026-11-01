import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type {
  Encounter,
  EventSetup,
  MatchSetup
} from '@scoreboard/protocol/event-setup'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'
import { matchOn, setupWith } from '@scoreboard/protocol/testing/event-setups'
import {
  point,
  stampedAt,
  started
} from '@scoreboard/protocol/testing/scoring-events'

import { publicSnapshotFor } from '@scoreboard/core/event/public-snapshot'

import { firstStepOf, stepStatusOf } from './console-steps'
import { addEncounter } from './setup-edits'

const dayOf = (
  matches: MatchSetup[],
  scores: ReadonlyMap<string, readonly ScoringEvent[]> = new Map()
) => {
  const setup = setupWith(matches, { tableCount: 8 })

  return {
    event: publicSnapshotFor({
      logs: new Map(
        [...scores].map(([id, events]) => [
          id,
          events.map((event, index) => stampedAt(index + 1, event))
        ])
      ),
      nowMs: 1000,
      setup
    }),
    setup
  }
}

const encounter: Encounter = {
  away: randomUUID(),
  formatId: 'fftt-3-players-10-games',
  home: randomUUID(),
  id: randomUUID(),
  matchPoints: 'one-per-win'
}

const encounterDayWith = (away: Record<string, string>): EventSetup =>
  addEncounter({
    encounter,
    lineups: {
      away,
      home: { A: randomUUID(), B: randomUUID(), C: randomUUID() }
    },
    newMatchId: randomUUID,
    setup: setupWith([], { tableCount: 8 })
  })

const encountersStatusOf = (setup: EventSetup) =>
  stepStatusOf({
    event: publicSnapshotFor({ logs: new Map(), nowMs: 1000, setup }),
    setup,
    step: 'encounters'
  })

describe('console steps', () => {
  it('[organiser] opens on the hall until a match begins, then on the live day', () => {
    const match = matchOn(1)

    expect(firstStepOf(dayOf([match]).event)).toBe('hall')
    expect(
      firstStepOf(dayOf([match], new Map([[match.id, [started()]]])).event)
    ).toBe('live')
  })

  it('[organiser] says how many tables stand and how many screens a TV shows', () => {
    expect(
      stepStatusOf({ ...dayOf([]), connectedScreens: 1, step: 'hall' })
    ).toEqual({ kind: 'hall', screens: 1, tables: 8 })
  })

  it('[organiser] asks for encounters once the championship is chosen', () => {
    expect(
      stepStatusOf({
        ...dayOf([]),
        chosenFormat: 'championship',
        step: 'encounters'
      })
    ).toEqual({ kind: 'noEncounter' })
  })

  it('[organiser] asks for a format until something is prepared, then counts free matches', () => {
    expect(stepStatusOf({ ...dayOf([]), step: 'encounters' })).toEqual({
      kind: 'formatToChoose'
    })
    expect(
      stepStatusOf({ ...dayOf([matchOn(1), matchOn(2)]), step: 'encounters' })
    ).toEqual({ kind: 'freeMatches', matches: 2 })
  })

  it('[organiser] counts the matches running, or says nothing is', () => {
    const playing = matchOn(1)
    const waiting = matchOn(2)

    expect(stepStatusOf({ ...dayOf([waiting]), step: 'live' })).toEqual({
      kind: 'nothingRunning'
    })
    expect(
      stepStatusOf({
        ...dayOf(
          [playing, waiting],
          new Map([[playing.id, [started(), point('home')]]])
        ),
        step: 'live'
      })
    ).toEqual({ kind: 'running', matches: 1 })
  })

  it('[organiser] calls an encounter ready once each letter is seated, its doubles composed on the day', () => {
    expect(
      encountersStatusOf(
        encounterDayWith({ X: randomUUID(), Y: randomUUID(), Z: randomUUID() })
      )
    ).toEqual({ encounters: 1, kind: 'encountersReady' })
    expect(
      encountersStatusOf(encounterDayWith({ X: randomUUID(), Y: randomUUID() }))
    ).toEqual({ encounters: 1, kind: 'lineupsToDo' })
  })
})
