import { describe, expect, it } from 'vitest'

import { describeMatch } from '@scoreboard/core/match/match-log'

import {
  advanceDemoDay,
  createDemoDay,
  type DemoDay,
  hasDemoDayRunOut,
  type Random
} from './demo-day'

const seeded = (seed: number): Random => {
  let state = seed

  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648

    return state / 2_147_483_648
  }
}

const NOW_MS = 1_800_000_000_000

const statesOf = (day: DemoDay) =>
  day.setup.matches.map((match) =>
    describeMatch(
      match.format,
      (day.logs.get(match.id) ?? []).map((stamped) => stamped.event)
    )
  )

describe('the demo day', () => {
  it('opens with every table of its four encounters already under way', () => {
    const day = createDemoDay(NOW_MS, seeded(1))
    const states = statesOf(day)
    const playing = day.setup.matches.filter(
      (_, index) => states[index]?.status === 'live'
    )

    expect(day.setup.encounters).toHaveLength(4)
    expect(new Set(playing.map((match) => match.table))).toEqual(
      new Set([1, 2, 3, 4, 5, 6, 7, 8])
    )
    expect(hasDemoDayRunOut(day)).toBe(false)
  })

  it('has played some sheet lines to the end before the visitor arrives', () => {
    const day = createDemoDay(NOW_MS, seeded(2))

    expect(statesOf(day).some((state) => state.status === 'finished')).toBe(
      true
    )
  })

  it('scores on, without ever logging an event the rules refuse', () => {
    let day = createDemoDay(NOW_MS, seeded(3))
    const eventsBefore = [...day.logs.values()].flat().length

    for (let step = 1; step <= 30; step++) {
      day = advanceDemoDay(day, NOW_MS + step * 1_000, seeded(step))
    }

    const states = statesOf(day)
    const eventsAfter = [...day.logs.values()].flat().length

    expect(eventsAfter).toBeGreaterThan(eventsBefore)
    expect(
      states.every(
        (state) => state.periodsWon.home <= 3 && state.periodsWon.away <= 3
      )
    ).toBe(true)
  })

  it('runs out once a table has played its whole sheet', () => {
    const homeWinsEveryPoint: Random = () => 0
    let day = createDemoDay(NOW_MS, homeWinsEveryPoint)
    let nowMs = NOW_MS

    while (!hasDemoDayRunOut(day) && nowMs < NOW_MS + 3_600_000) {
      nowMs += 4_000
      day = advanceDemoDay(day, nowMs, homeWinsEveryPoint)
    }

    expect(hasDemoDayRunOut(day)).toBe(true)
  })
})
