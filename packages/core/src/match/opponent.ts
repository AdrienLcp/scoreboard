import type { Side } from '@scoreboard/protocol/side'

export const opponentOf = (side: Side): Side =>
  side === 'home' ? 'away' : 'home'
