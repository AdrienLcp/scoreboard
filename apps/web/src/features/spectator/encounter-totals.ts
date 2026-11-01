import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { Side } from '@scoreboard/protocol/side'

/** What the foot of a signed sheet adds up for a team: parties, games and points won. */
export type TeamTotals = {
  games: number
  parties: number
  points: number
}

const totalsFor = (matches: readonly MatchView[], side: Side): TeamTotals =>
  matches.reduce(
    (totals, { state }) => ({
      games: totals.games + state.periodsWon[side],
      parties: totals.parties + (state.winner === side ? 1 : 0),
      points:
        totals.points +
        state.periods.reduce((sum, period) => sum + period[side], 0)
    }),
    { games: 0, parties: 0, points: 0 }
  )

/** Both teams' totals over the encounter's finished matches, home being the sheet's first team. */
export const encounterTotalsOf = (
  matches: readonly MatchView[]
): Record<Side, TeamTotals> => {
  const finished = matches.filter((match) => match.state.status === 'finished')

  return {
    away: totalsFor(finished, 'away'),
    home: totalsFor(finished, 'home')
  }
}
