import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { Side } from '@scoreboard/protocol/side'

/**
 * What the umpire would call out right now, if anything: one point from the
 * game or the match for a side, or level at the end of a game.
 */
export type MatchCall =
  | { kind: 'match-point'; side: Side }
  | { kind: 'game-point'; side: Side }
  | { kind: 'deuce' }

export const matchCallOf = ({
  format,
  state
}: Pick<MatchView, 'format' | 'state'>): MatchCall | null => {
  if (state.status !== 'live' || state.current === null) {
    return null
  }

  if (state.stake !== null) {
    return {
      kind: state.stake.decides === 'match' ? 'match-point' : 'game-point',
      side: state.stake.side
    }
  }

  const { away, home } = state.current
  const isLevelAtTheEnd = home === away && home >= format.pointsPerGame - 1

  return isLevelAtTheEnd ? { kind: 'deuce' } : null
}

/** The side a call puts one point from winning something, to light its row. */
export const hotSideOf = (call: MatchCall | null): Side | null =>
  call === null || call.kind === 'deuce' ? null : call.side
