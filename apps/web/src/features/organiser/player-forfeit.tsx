import type React from 'react'
import { useState } from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { EncounterId, MatchId } from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'

import { forfeitedMatchesOf } from '@scoreboard/core/encounter/player-forfeit'

import { newScoringEventId } from '@/infrastructure/ids'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { ChoiceField } from './choice-field'
import { ConfirmButton } from './confirm-button'

import './player-forfeit.sass'

type PlayerForfeitProps = {
  encounterId: EncounterId
  matches: readonly MatchView[]
  onRecord: (matchId: MatchId, event: ScoringEvent) => void
  setup: EventSetup
}

/**
 * A player who does not come to the table: one choice gives up every match
 * of the encounter still waiting for him, by walkover, as the sheet records it.
 */
export const PlayerForfeit: React.FC<PlayerForfeitProps> = ({
  encounterId,
  matches,
  onRecord,
  setup
}) => {
  const translate = useTranslate()
  const [playerId, setPlayerId] = useState<string | null>(null)
  const encounterMatches = matches.filter(
    (match) => match.encounterId === encounterId
  )
  const playerIds = new Set(
    encounterMatches.flatMap((match) => [
      ...match.home.playerIds,
      ...match.away.playerIds
    ])
  )
  const choices = setup.players
    .filter((player) => playerIds.has(player.id))
    .map((player) => ({ id: player.id, label: player.name }))
  const forfeited =
    playerId === null
      ? []
      : forfeitedMatchesOf({ matches: encounterMatches, playerId })
  const name = choices.find((choice) => choice.id === playerId)?.label ?? ''

  if (choices.length === 0) {
    return null
  }

  return (
    <div className='player-forfeit'>
      <ChoiceField
        choices={choices}
        label={translate('organiser.forfeit.player')}
        onChange={setPlayerId}
        placeholder={translate('organiser.choosePlayer')}
        selectedId={playerId}
      />
      {playerId === null ? null : forfeited.length === 0 ? (
        <p className='organiser-note'>{translate('organiser.forfeit.none')}</p>
      ) : (
        <ConfirmButton
          confirmLabel={translate('organiser.forfeit.confirm', {
            count: forfeited.length,
            name
          })}
          label={translate('organiser.forfeit.declare', {
            count: forfeited.length
          })}
          onConfirm={() => {
            for (const { by, matchId } of forfeited) {
              onRecord(matchId, {
                by,
                id: newScoringEventId(),
                reason: 'walkover',
                type: 'match.conceded'
              })
            }

            setPlayerId(null)
          }}
        />
      )}
    </div>
  )
}
