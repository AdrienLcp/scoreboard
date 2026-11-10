import type {
  CalendarDate,
  ChampionshipPool
} from '@scoreboard/protocol/championship'
import type { ClubRecord } from '@scoreboard/protocol/club-record'
import type { ClubHallPlan } from '@scoreboard/protocol/hall-plan'
import type {
  EncounterId,
  EventId,
  MatchId
} from '@scoreboard/protocol/identifiers'
import type { CreateEventInput } from '@scoreboard/protocol/routes'

import { initialSetupOf } from '@scoreboard/core/event/initial-setup'
import { standingTablesOf } from '@scoreboard/core/hall/hall-plan'

import {
  isPlayedAtHome,
  type PlacedEntry,
  placeEntries,
  type RoundEntry,
  roundEntriesOf
} from '@/features/club/round-entries'
import type { FederationPoolsById } from '@/features/club/use-federation-pools'

/** The club's own hall, until it keeps a plan: tables are added or put away in the event's plan. */
export const DEFAULT_TABLE_COUNT = 8
/** Three games to win, the federation's usual match; each match can be set otherwise in the programme. */
const DEFAULT_BEST_OF = 5
const POINTS_PER_GAME = 11

/** The plan new events start from: the default saved plan, or the first one kept. */
export const defaultSavedPlanOf = (record: ClubRecord): ClubHallPlan | null =>
  record.plans.find((saved) => saved.id === record.defaultPlanId) ??
  record.plans[0] ??
  null

/** The tables a new event stands up: the default plan's, or eight. */
export const standingTableCountOf = (record: ClubRecord | null): number => {
  const saved = record === null ? null : defaultSavedPlanOf(record)

  return saved === null
    ? DEFAULT_TABLE_COUNT
    : standingTablesOf(saved.plan).length
}

/** A new event as home opens it: the club's name, logo and default plan, or eight tables, three games to win. */
export const eventInputFor = ({
  name,
  record
}: {
  name: string
  record: ClubRecord | null
}): CreateEventInput => {
  const hall =
    record === null ? null : (defaultSavedPlanOf(record)?.plan ?? null)

  return {
    club:
      record === null
        ? null
        : { colours: null, logoUrl: record.own.logoUrl, name: record.own.name },
    format: {
      bestOf: DEFAULT_BEST_OF,
      pointsPerGame: POINTS_PER_GAME,
      sport: 'table-tennis'
    },
    hall,
    name,
    tableCount: hall?.tables.length ?? DEFAULT_TABLE_COUNT
  }
}

/** The championship round home leads with: our encounters, at home then away. */
export type ClubRound = {
  away: RoundEntry[]
  /** Shared by every pool's round, otherwise `null`. */
  date: CalendarDate | null
  home: RoundEntry[]
  /** Whether the FFTT's calendar gave one of its encounters: its source is then named. */
  isFromFederation: boolean
  /** The round's number when every pool plays the same one, otherwise `null`. */
  number: number | null
  phase: ChampionshipPool['phase'] | null
}

const onlyValueOf = <TValue>(values: readonly TValue[]): TValue | null => {
  const distinct = [...new Set(values)]

  return distinct.length === 1 ? (distinct[0] ?? null) : null
}

/** The round dated today, else the next one to come, as the console's teams step offers it; `null` when none is left. */
export const clubRoundOf = (
  record: ClubRecord,
  today: CalendarDate,
  federationPools?: FederationPoolsById
): ClubRound | null => {
  const entries = roundEntriesOf(record, today, federationPools)

  if (entries.length === 0) {
    return null
  }

  return {
    away: entries.filter((entry) => !isPlayedAtHome(entry)),
    date: onlyValueOf(entries.map((entry) => entry.date)),
    home: entries.filter(isPlayedAtHome),
    isFromFederation: entries.some((entry) => entry.isFromFederation),
    number: onlyValueOf(entries.map((entry) => entry.roundNumber)),
    phase: onlyValueOf(entries.map((entry) => entry.phase))
  }
}

/** The event this device organises that the round's home encounters were prepared in. */
export const roundEventOf = (
  round: ClubRound,
  organisedEventIds: readonly EventId[]
): EventId | null =>
  round.home
    .map((entry) => entry.kept?.fixture.playedAs?.eventId)
    .find(
      (eventId): eventId is EventId =>
        eventId !== undefined && organisedEventIds.includes(eventId)
    ) ?? null

/** The round's home encounters prepared in that event, and how many of them have a result. */
export const roundProgressIn = (
  round: ClubRound,
  eventId: EventId
): { finished: number; total: number } => {
  const prepared = round.home.filter(
    (entry) => entry.kept?.fixture.playedAs?.eventId === eventId
  )

  return {
    finished: prepared.filter((entry) => entry.kept?.fixture.result != null)
      .length,
    total: prepared.length
  }
}

/**
 * The round's day ready to open: the club's default plan with each home
 * encounter on its tables and each team's last composition, as the console
 * would add them, and where each one went.
 */
export const roundEventInput = ({
  name,
  newEncounterId,
  newMatchId,
  record,
  round
}: {
  name: string
  newEncounterId: () => EncounterId
  newMatchId: () => MatchId
  record: ClubRecord
  round: ClubRound
}): { input: CreateEventInput; placed: PlacedEntry[] } => {
  const base = eventInputFor({ name, record })
  const { placed, setup } = placeEntries({
    entries: round.home,
    newEncounterId,
    newMatchId,
    setup: initialSetupOf(base)
  })

  return {
    input: {
      ...base,
      programme: {
        encounters: setup.encounters,
        matches: setup.matches,
        players: setup.players,
        teams: setup.teams
      }
    },
    placed
  }
}
