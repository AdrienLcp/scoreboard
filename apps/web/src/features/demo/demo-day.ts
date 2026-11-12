import type {
  EventSetup,
  MatchSetup,
  Player,
  Team
} from '@scoreboard/protocol/event-setup'
import type { MatchId } from '@scoreboard/protocol/identifiers'
import type { TableTennisFormat } from '@scoreboard/protocol/match-format'
import type { MatchState } from '@scoreboard/protocol/match-state'
import type {
  ScoringEvent,
  StampedEvent
} from '@scoreboard/protocol/scoring-event'

import { type MatchReplay, replayMatch } from '@scoreboard/core/match/match-log'

/** A number in [0, 1), so a test can play the day the same way twice. */
export type Random = () => number

/**
 * A fictional team day: what was prepared, what each match has logged so far,
 * and each match replayed to its last event, so a step costs one event and
 * never a replay of the day.
 */
export type DemoDay = {
  logs: ReadonlyMap<MatchId, readonly StampedEvent[]>
  replays: ReadonlyMap<MatchId, MatchReplay>
  setup: EventSetup
}

const BEST_OF_5: TableTennisFormat = {
  bestOf: 5,
  pointsPerGame: 11,
  sport: 'table-tennis'
}

/** Seconds a won game waits on screen before the umpire confirms it. */
const CONFIRM_AFTER_MS = 3_000
/** A finished match keeps its table this long before the next one starts. */
const NEXT_MATCH_AFTER_MS = 7_000
/** How often a live table scores a point at each step. */
const POINT_CHANCE = 0.4
/** The history played before the visitor arrives, one step a few seconds apart. */
const HISTORY_STEPS = 260
const HISTORY_STEP_MS = 4_000

type EncounterPlan = {
  away: { name: string; players: readonly [string, string, string] }
  home: {
    colour: string
    name: string
    players: readonly [string, string, string]
  }
}

/** Invented clubs and players, the club's own teams in the colours the club gave its four first teams. */
const ENCOUNTERS: readonly EncounterPlan[] = [
  {
    away: {
      name: 'Saint-Aubin 2',
      players: ['Théo Garnier', 'Julie Caron', 'Rémi Dubois']
    },
    home: {
      colour: '#8FCBEF',
      name: 'Les Rives 1',
      players: ['Hugo Lambert', 'Manon Girard', 'Clément Marchand']
    }
  },
  {
    away: {
      name: 'Port-Joli 1',
      players: ['Inès Vidal', 'Louis Brun', 'Yanis Perrot']
    },
    home: {
      colour: '#F4A259',
      name: 'Les Rives 2',
      players: ['Lucas Morel', 'Nadia Berger', 'Paul Chevalier']
    }
  },
  {
    away: {
      name: 'Val-Fleuri 3',
      players: ['Léa Blanc', 'Marc Meyer', 'Adam Fabre']
    },
    home: {
      colour: '#E9C46A',
      name: 'Les Rives 3',
      players: ['Emma Petit', 'Jules Roux', 'Simon Leroy']
    }
  },
  {
    away: {
      name: 'Les Prés 2',
      players: ['Chloé Martin', 'Nathan Robin', 'Zoé Meunier']
    },
    home: {
      colour: '#007A42',
      name: 'Les Rives 4',
      players: ['Arthur Noël', 'Camille Faure', 'Victor Gay']
    }
  }
]

/** The sheet's lines on the encounter's two tables, in playing order; a pair of letters names its players. */
const SHEET: readonly (readonly [string, string])[] = [
  ['AX', 'BY'],
  ['CZ', 'AY'],
  ['BX', 'CX'],
  ['Double 1', 'AZ'],
  ['CY', 'BZ']
]

const HOME_LETTERS = ['A', 'B', 'C'] as const
const AWAY_LETTERS = ['X', 'Y', 'Z'] as const

const rankingPoints = (random: Random): number =>
  500 + Math.round(random() * 140) * 10

const playerOf = (name: string, teamId: string, random: Random): Player => ({
  id: crypto.randomUUID(),
  licence: null,
  name,
  points: rankingPoints(random),
  teamId
})

const sideOf = (
  label: string,
  letters: readonly string[],
  players: readonly Player[]
): string[] =>
  label.startsWith('Double')
    ? players.slice(0, 2).map((player) => player.id)
    : letters.flatMap((letter, index) => {
        const player = players[index]

        return player !== undefined && label.includes(letter) ? [player.id] : []
      })

const setupFor = (random: Random): EventSetup => {
  const teams: Team[] = []
  const players: Player[] = []
  const matches: MatchSetup[] = []
  const encounters = ENCOUNTERS.map((plan, index) => {
    const home: Team = {
      colour: plan.home.colour,
      id: crypto.randomUUID(),
      name: plan.home.name
    }
    const away: Team = {
      colour: null,
      id: crypto.randomUUID(),
      name: plan.away.name
    }
    const homePlayers = plan.home.players.map((name) =>
      playerOf(name, home.id, random)
    )
    const awayPlayers = plan.away.players.map((name) =>
      playerOf(name, away.id, random)
    )
    const encounterId = crypto.randomUUID()
    const firstTable = index * 2 + 1

    teams.push(home, away)
    players.push(...homePlayers, ...awayPlayers)

    for (const round of SHEET) {
      round.forEach((label, offset) => {
        matches.push({
          away: { playerIds: sideOf(label, AWAY_LETTERS, awayPlayers) },
          encounterId,
          format: BEST_OF_5,
          home: { playerIds: sideOf(label, HOME_LETTERS, homePlayers) },
          id: crypto.randomUUID(),
          label,
          plannedAtMs: null,
          table: firstTable + offset
        })
      })
    }

    return {
      away: away.id,
      formatId: 'fftt-6-players-20-games' as const,
      home: home.id,
      id: encounterId,
      matchPoints: 'one-per-win' as const
    }
  })

  return {
    club: { colours: null, logoUrl: null, name: 'TT Les Rives' },
    defaultFormat: BEST_OF_5,
    displays: [],
    encounters,
    hall: null,
    matches,
    name: 'Demo team day',
    players,
    startsAtMs: null,
    tableCount: ENCOUNTERS.length * 2,
    teams,
    wallView: 'encounters'
  }
}

/** What a table's umpire does next at `nowMs`, or nothing while the table waits. */
const nextEventOn = ({
  log,
  nowMs,
  random,
  state
}: {
  log: readonly StampedEvent[]
  nowMs: number
  random: Random
  state: MatchState
}): ScoringEvent | null => {
  const lastAtMs = log.at(-1)?.recordedAtMs ?? 0

  if (state.status === 'scheduled') {
    return {
      firstServer: random() < 0.5 ? 'home' : 'away',
      id: crypto.randomUUID(),
      type: 'match.started'
    }
  }

  if (state.awaiting !== null) {
    return nowMs - lastAtMs >= CONFIRM_AFTER_MS
      ? { id: crypto.randomUUID(), type: 'period.confirmed' }
      : null
  }

  if (random() >= POINT_CHANCE) {
    return null
  }

  return {
    id: crypto.randomUUID(),
    side: random() < 0.5 ? 'home' : 'away',
    type: 'point.scored'
  }
}

const stateOf = (day: DemoDay, match: MatchSetup): MatchState =>
  (day.replays.get(match.id) ?? replayMatch(match.format)).state

/**
 * One step of the day at `nowMs`: each table's match in play scores or
 * confirms a game, and a table whose match ended a while ago starts its next.
 */
export const advanceDemoDay = (
  day: DemoDay,
  nowMs: number,
  random: Random
): DemoDay => {
  const logs = new Map(day.logs)
  const replays = new Map(day.replays)
  const tables = new Set(day.setup.matches.map((match) => match.table))

  for (const table of tables) {
    const queue = day.setup.matches.filter((match) => match.table === table)
    const finished = queue.filter(
      (match) => stateOf(day, match).status === 'finished'
    )
    const match = queue.find((candidate) => !finished.includes(candidate))

    if (match === undefined) {
      continue
    }

    const log = logs.get(match.id) ?? []
    const previousLog = logs.get(finished.at(-1)?.id ?? '') ?? []
    const previousEndMs = previousLog.at(-1)?.recordedAtMs ?? 0

    if (log.length === 0 && nowMs - previousEndMs < NEXT_MATCH_AFTER_MS) {
      continue
    }

    const event = nextEventOn({
      log,
      nowMs,
      random,
      state: stateOf(day, match)
    })

    if (event !== null) {
      logs.set(match.id, [...log, { event, recordedAtMs: nowMs }])
      replays.set(
        match.id,
        (replays.get(match.id) ?? replayMatch(match.format)).with(event)
      )
    }
  }

  return { logs, replays, setup: day.setup }
}

/**
 * Whether a table has played its whole sheet: the day starts again before
 * the wall runs out of matches to show.
 */
export const hasDemoDayRunOut = (day: DemoDay): boolean => {
  const tables = new Set(day.setup.matches.map((match) => match.table))

  return [...tables].some((table) =>
    day.setup.matches
      .filter((match) => match.table === table)
      .every((match) => stateOf(day, match).status === 'finished')
  )
}

/**
 * A fictional club's team day already under way at `nowMs`: four encounters
 * on eight tables, each table some matches into its sheet.
 */
export const createDemoDay = (nowMs: number, random: Random): DemoDay => {
  let day: DemoDay = {
    logs: new Map(),
    replays: new Map(),
    setup: setupFor(random)
  }
  const startMs = nowMs - HISTORY_STEPS * HISTORY_STEP_MS

  for (let step = 0; step < HISTORY_STEPS; step++) {
    day = advanceDemoDay(day, startMs + step * HISTORY_STEP_MS, random)
  }

  return day
}
