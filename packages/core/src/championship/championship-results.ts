import type {
  ChampionshipPool,
  FixtureResult
} from '@scoreboard/protocol/championship'
import type { Encounter } from '@scoreboard/protocol/event-setup'
import type { EncounterView } from '@scoreboard/protocol/event-snapshot'
import type { EventId, TeamId } from '@scoreboard/protocol/identifiers'
import type { Side } from '@scoreboard/protocol/side'

import type {
  EncounterFormat,
  MatchPoints
} from '../encounter/encounter-format'
import { fixtureTeamsOf } from './championship-calendar'

const forfeitOf = ({
  absent,
  sheetPoints
}: {
  absent: Side
  sheetPoints: number
}): FixtureResult => ({
  forfeit: absent,
  score:
    absent === 'home'
      ? { away: sheetPoints, home: 0 }
      : { away: 0, home: sheetPoints }
})

/**
 * Every result an encounter of this sheet can end on, the home side's best
 * first: each count of matches won with the sheet played out, then each
 * side's forfeit, which gives the other every match.
 */
export const resultChoicesFor = ({
  format,
  matchPoints
}: {
  format: EncounterFormat
  matchPoints: MatchPoints
}): FixtureResult[] => {
  const matchCount = format.sheet.length
  const played = Array.from({ length: matchCount + 1 }, (_, index) => {
    const homeWins = matchCount - index
    const awayWins = index

    return {
      forfeit: null,
      score: {
        away: awayWins * matchPoints.win + homeWins * matchPoints.loss,
        home: homeWins * matchPoints.win + awayWins * matchPoints.loss
      }
    }
  })
  const sheetPoints = matchCount * matchPoints.win

  return [
    ...played,
    forfeitOf({ absent: 'away', sheetPoints }),
    forfeitOf({ absent: 'home', sheetPoints })
  ]
}

export const isSameResult = (
  one: FixtureResult | null,
  other: FixtureResult | null
): boolean =>
  one === other ||
  (one !== null &&
    other !== null &&
    one.forfeit === other.forfeit &&
    one.score.home === other.score.home &&
    one.score.away === other.score.away)

const resultOfSheet = ({
  encounter,
  fixtureHome,
  view
}: {
  encounter: Encounter
  fixtureHome: TeamId | null
  view: EncounterView
}): FixtureResult => {
  const isSameWay = encounter.home === fixtureHome

  return {
    forfeit: null,
    score: isSameWay
      ? view.points
      : { away: view.points.home, home: view.points.away }
  }
}

/**
 * Writes the finished sheets of an event into the fixtures they were played
 * for. A fixture whose result was picked by hand no longer follows a sheet.
 * The pool comes back unchanged, the same object, when nothing moved.
 */
export const withSheetResults = ({
  encounters,
  eventId,
  pool,
  views
}: {
  encounters: readonly Encounter[]
  eventId: EventId
  pool: ChampionshipPool
  views: readonly EncounterView[]
}): ChampionshipPool => {
  const rounds = pool.rounds.map((round) => ({
    ...round,
    fixtures: round.fixtures.map((fixture) => {
      if (fixture.playedAs?.eventId !== eventId) {
        return fixture
      }

      const { encounterId } = fixture.playedAs
      const encounter = encounters.find(
        (candidate) => candidate.id === encounterId
      )
      const view = views.find((candidate) => candidate.id === encounterId)

      if (
        encounter === undefined ||
        view === undefined ||
        view.outcome === null
      ) {
        return fixture
      }

      const result = resultOfSheet({
        encounter,
        fixtureHome: fixtureTeamsOf(pool, fixture).home,
        view
      })

      return isSameResult(result, fixture.result)
        ? fixture
        : { ...fixture, result }
    })
  }))
  const hasChanged = rounds.some((round, roundIndex) =>
    round.fixtures.some(
      (fixture, index) => fixture !== pool.rounds[roundIndex]?.fixtures[index]
    )
  )

  return hasChanged ? { ...pool, rounds } : pool
}
