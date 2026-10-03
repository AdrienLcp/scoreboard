import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'

/** The whole day as a visitor's phone lists it. */
export type SpectatorProgramme = {
  /** Most recently listed first: the last matches of the programme ended last. */
  finished: MatchView[]
  /** In table order. */
  live: MatchView[]
  /** In playing order. */
  upcoming: MatchView[]
}

const byTable = (left: MatchView, right: MatchView): number =>
  (left.table ?? Number.POSITIVE_INFINITY) -
  (right.table ?? Number.POSITIVE_INFINITY)

export const spectatorProgrammeFor = (
  snapshot: PublicSnapshot
): SpectatorProgramme => {
  const withStatus = (status: MatchView['state']['status']) =>
    snapshot.matches.filter((match) => match.state.status === status)

  return {
    finished: withStatus('finished').toReversed(),
    live: withStatus('live').toSorted(byTable),
    upcoming: withStatus('scheduled')
  }
}
