import type { Participant, Player } from '@scoreboard/protocol/event-setup'

/** The names on one side of a match; empty while nobody is named for it. */
export const participantNames = (
  players: readonly Player[],
  participant: Participant
): string[] =>
  participant.playerIds.flatMap((playerId) => {
    const player = players.find((candidate) => candidate.id === playerId)

    return player === undefined ? [] : [player.name]
  })
