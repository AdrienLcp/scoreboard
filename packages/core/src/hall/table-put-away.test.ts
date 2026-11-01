import { randomUUID } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import type { EventSetup, MatchSetup } from '@scoreboard/protocol/event-setup'
import type { MatchId, TableNumber } from '@scoreboard/protocol/identifiers'
import type { MatchStatus } from '@scoreboard/protocol/match-state'
import { matchOn, setupWith } from '@scoreboard/protocol/testing/event-setups'

import { defaultHallPlan, isHiddenIn, putAwayHallTables } from './hall-plan'
import {
  freeTablesFor,
  matchesRunningOn,
  putAwayTables,
  resumeWaitingMatchOn,
  waitingMatchesOf
} from './table-put-away'

const statusesOf =
  (statuses: ReadonlyMap<MatchId, MatchStatus>) =>
  (matchId: MatchId): MatchStatus =>
    statuses.get(matchId) ?? 'scheduled'

const tableOf = (setup: EventSetup, match: MatchSetup): TableNumber | null =>
  setup.matches.find((candidate) => candidate.id === match.id)?.table ?? null

const eightTables = (matches: MatchSetup[]): EventSetup =>
  setupWith(matches, { hall: defaultHallPlan(8), tableCount: 8 })

describe('putting away a table whose match is running', () => {
  const played = matchOn(3)
  const running = matchOn(3)
  const next = matchOn(3)
  const elsewhere = matchOn(4)
  const statusOf = statusesOf(
    new Map([
      [played.id, 'finished'],
      [running.id, 'live']
    ])
  )

  it('[put-away] lists the matches played on the tables leaving, in table order', () => {
    const onFour = matchOn(4)
    const both = statusesOf(
      new Map([
        [running.id, 'live'],
        [onFour.id, 'live']
      ])
    )

    expect(
      matchesRunningOn({
        matches: [onFour, played, running],
        statusOf: both,
        tables: [3, 4]
      }).map((match) => match.id)
    ).toEqual([running.id, onFour.id])
  })

  it('[put-away] offers the standing tables with nothing played on them and not already chosen', () => {
    const onFive = matchOn(5)
    const setup = {
      ...eightTables([running, onFive, matchOn(6)]),
      hall: putAwayHallTables(defaultHallPlan(8), [8])
    }

    expect(
      freeTablesFor({
        leaving: [3, 4],
        setup,
        statusOf: statusesOf(
          new Map([
            [running.id, 'live'],
            [onFive.id, 'live']
          ])
        ),
        taken: [7]
      })
    ).toEqual([1, 2, 6])
  })

  it('[put-away] carries the running match and the ones to come to the table chosen, the finished one staying', () => {
    const setup = putAwayTables({
      destinations: new Map([[running.id, 7]]),
      setup: eightTables([played, running, next, elsewhere]),
      statusOf,
      tables: [3]
    })

    expect(isHiddenIn(setup.hall ?? defaultHallPlan(8), 3)).toBe(true)
    expect(tableOf(setup, played)).toBe(3)
    expect(tableOf(setup, running)).toBe(7)
    expect(tableOf(setup, next)).toBe(7)
    expect(tableOf(setup, elsewhere)).toBe(4)
  })

  it('[put-away] leaves a waiting match on no table, the ones to come keeping the number to come back with it', () => {
    const setup = putAwayTables({
      destinations: new Map([[running.id, 'waiting']]),
      setup: eightTables([played, running, next]),
      statusOf,
      tables: [3]
    })

    expect(tableOf(setup, running)).toBeNull()
    expect(tableOf(setup, next)).toBe(3)
    expect(
      waitingMatchesOf({ matches: setup.matches, statusOf }).map(
        (match) => match.id
      )
    ).toEqual([running.id])
  })

  it('[put-away] hands an encounter’s matches to come to its other table still standing', () => {
    const encounterId = randomUUID()
    const runningThree = matchOn(3, { encounterId })
    const nextThree = matchOn(3, { encounterId })
    const nextFour = matchOn(4, { encounterId })
    const setup = putAwayTables({
      destinations: new Map([[runningThree.id, 7]]),
      setup: eightTables([runningThree, nextFour, nextThree]),
      statusOf: statusesOf(new Map([[runningThree.id, 'live']])),
      tables: [3]
    })

    expect(tableOf(setup, runningThree)).toBe(7)
    expect(tableOf(setup, nextThree)).toBe(4)
    expect(tableOf(setup, nextFour)).toBe(4)
  })

  it('[put-away] sends each table’s matches to come after its own running match when the whole block goes', () => {
    const encounterId = randomUUID()
    const runningThree = matchOn(3, { encounterId })
    const runningFour = matchOn(4, { encounterId })
    const nextThree = matchOn(3, { encounterId })
    const nextFour = matchOn(4, { encounterId })
    const setup = putAwayTables({
      destinations: new Map<MatchId, TableNumber | 'waiting'>([
        [runningThree.id, 7],
        [runningFour.id, 'waiting']
      ]),
      setup: eightTables([runningThree, runningFour, nextThree, nextFour]),
      statusOf: statusesOf(
        new Map([
          [runningThree.id, 'live'],
          [runningFour.id, 'live']
        ])
      ),
      tables: [3, 4]
    })

    expect(tableOf(setup, nextThree)).toBe(7)
    expect(tableOf(setup, runningFour)).toBeNull()
    expect(tableOf(setup, nextFour)).toBe(4)
  })
})

describe('a match waiting for a table', () => {
  const waiting = matchOn(null)
  const waitingAfter = matchOn(null)
  const unseated = matchOn(null)
  const onTwo = matchOn(2)
  const statusOf = statusesOf(
    new Map([
      [waiting.id, 'live'],
      [waitingAfter.id, 'live'],
      [onTwo.id, 'live']
    ])
  )

  it('[put-away] resumes the first one waiting on the table freed, a match never started staying unseated', () => {
    const setup = resumeWaitingMatchOn({
      setup: setupWith([unseated, waiting, waitingAfter, onTwo]),
      statusOf,
      table: 1
    })

    expect(tableOf(setup, waiting)).toBe(1)
    expect(tableOf(setup, waitingAfter)).toBeNull()
    expect(tableOf(setup, unseated)).toBeNull()
  })

  it('[put-away] brings along the matches of its encounter left on a table put away', () => {
    const encounterId = randomUUID()
    const resumed = matchOn(null, { encounterId })
    const leftBehind = matchOn(3, { encounterId })
    const played = matchOn(3, { encounterId })
    const otherEncounter = matchOn(3, { encounterId: randomUUID() })
    const setup = resumeWaitingMatchOn({
      setup: setupWith([played, resumed, leftBehind, otherEncounter], {
        hall: putAwayHallTables(defaultHallPlan(4), [3])
      }),
      statusOf: statusesOf(
        new Map([
          [resumed.id, 'live'],
          [played.id, 'finished']
        ])
      ),
      table: 1
    })

    expect(tableOf(setup, resumed)).toBe(1)
    expect(tableOf(setup, leftBehind)).toBe(1)
    expect(tableOf(setup, played)).toBe(3)
    expect(tableOf(setup, otherEncounter)).toBe(3)
  })

  it('[put-away] keeps it waiting while the table plays or is put away', () => {
    const setup = setupWith([waiting, onTwo], {
      hall: putAwayHallTables(defaultHallPlan(4), [3])
    })

    expect(resumeWaitingMatchOn({ setup, statusOf, table: 2 })).toBe(setup)
    expect(resumeWaitingMatchOn({ setup, statusOf, table: 3 })).toBe(setup)
  })
})
