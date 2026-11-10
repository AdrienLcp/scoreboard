import type { ChampionshipPool } from '@scoreboard/protocol/championship'
import type { ClubRecord } from '@scoreboard/protocol/club-record'
import type {
  FederationClubNumber,
  FederationFixture,
  FederationPool,
  FederationRound,
  FederationStanding,
  FederationTeam
} from '@scoreboard/protocol/federation'
import type { Side } from '@scoreboard/protocol/side'

import { fixtureTeamsOf } from '@scoreboard/core/championship/championship-calendar'

import { isOwnTeam } from './club-teams'

/** "Angles 2", "PPC ANGLES 2", "PPC ANGLES (2)": the number a club gives its team, at the end of its name. */
const TRAILING_NUMBER = /\(?(\d+)\)?\s*$/

/** A team's number in its club; a name without one is the club's only, or first, team. */
export const teamNumberOf = (name: string): number =>
  Number(TRAILING_NUMBER.exec(name)?.[1] ?? 1)

/** "LUCON TT (1)", as a pool's fixtures print a team, written the way its standings do: "LUCON TT 1". */
export const fixtureLabelAsName = (label: string): string =>
  label.replace(/\s*\((\d+)\)\s*$/, ' $1')

/**
 * The FFTT team one of ours plays as, matched by the number ending both names
 * ("Angles 2" ↔ "PPC ANGLES 2"), in the pool's phase, with a pool to read.
 */
export const federationTeamOf = ({
  name,
  phase,
  teams
}: {
  name: string
  phase: ChampionshipPool['phase']
  teams: readonly FederationTeam[]
}): FederationTeam | null => {
  const number = teamNumberOf(name)

  return (
    teams.find(
      (team) =>
        team.pool !== null &&
        (team.phase === null || team.phase === phase) &&
        teamNumberOf(team.name) === number
    ) ?? null
  )
}

/** Who we are in the FFTT's pool: our club's number and our team there. */
export type FederationSelf = {
  clubNumber: FederationClubNumber
  team: FederationTeam
}

const isSelf = (
  self: FederationSelf,
  clubNumber: FederationClubNumber | null,
  teamId: string | null | undefined,
  label: string
) =>
  teamId !== undefined && teamId !== null && teamId !== ''
    ? teamId === self.team.id
    : clubNumber === self.clubNumber &&
      teamNumberOf(label) === teamNumberOf(self.team.name)

export const isSelfStanding = (
  self: FederationSelf,
  row: FederationStanding
): boolean => isSelf(self, row.clubNumber, row.teamId, row.team)

/** Our encounter of a round and the side we play it on; `null` on a round we rest. */
export const selfFixtureOf = (
  self: FederationSelf,
  round: FederationRound
): { fixture: FederationFixture; side: Side } | null => {
  for (const fixture of round.fixtures) {
    if (
      isSelf(
        self,
        fixture.homeClubNumber,
        fixture.encounter?.homeTeamId,
        fixture.homeTeam
      )
    ) {
      return { fixture, side: 'home' }
    }

    if (
      isSelf(
        self,
        fixture.awayClubNumber,
        fixture.encounter?.awayTeamId,
        fixture.awayTeam
      )
    ) {
      return { fixture, side: 'away' }
    }
  }

  return null
}

/** A score from our side: what we took, what they took. */
export type OwnScore = { ours: number; theirs: number }

/** The FFTT's score of our encounter, from our side; `null` until it publishes one. */
export const federationScoreOf = (
  fixture: FederationFixture,
  side: Side
): OwnScore | null => {
  if (fixture.homeScore === null || fixture.awayScore === null) {
    return null
  }

  return side === 'home'
    ? { ours: fixture.homeScore, theirs: fixture.awayScore }
    : { ours: fixture.awayScore, theirs: fixture.homeScore }
}

/**
 * What our own sheet gave on a round the FFTT has not published yet: the
 * hand-kept pool's result of our encounter that round, from our side.
 */
export const sheetScoreOf = ({
  pool,
  record,
  roundNumber
}: {
  pool: ChampionshipPool
  record: ClubRecord
  roundNumber: number
}): OwnScore | null => {
  for (const fixture of pool.rounds.at(roundNumber - 1)?.fixtures ?? []) {
    const teams = fixtureTeamsOf(pool, fixture)
    const side: Side | null = isOwnTeam(record, teams.home)
      ? 'home'
      : isOwnTeam(record, teams.away)
        ? 'away'
        : null

    if (side !== null && fixture.result?.forfeit === null) {
      const { score } = fixture.result

      return side === 'home'
        ? { ours: score.home, theirs: score.away }
        : { ours: score.away, theirs: score.home }
    }
  }

  return null
}

/** The first round of ours the FFTT holds no score for: the one to prepare. */
export const nextFederationRoundOf = (
  self: FederationSelf,
  pool: FederationPool
): FederationRound | null =>
  pool.rounds.find((round) => {
    const own = selfFixtureOf(self, round)

    return own !== null && federationScoreOf(own.fixture, own.side) === null
  }) ?? null
