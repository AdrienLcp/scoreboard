import type React from 'react'
import { useState } from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { EncounterId, MatchId } from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'
import type { Side } from '@scoreboard/protocol/side'

import { encounterFormatFor } from '@scoreboard/core/encounter/encounter-formats'
import {
  type ForfeitSeat,
  forfeitedMatchesOf,
  vacantLettersOf,
  walkoversOf
} from '@scoreboard/core/encounter/player-forfeit'

import { newScoringEventId } from '@/infrastructure/ids'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
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

type SeatChoice = { id: string; label: string; seat: ForfeitSeat }

const SIDES: readonly Side[] = ['home', 'away']

/**
 * Whoever does not come to the table: a player, or a letter nobody holds
 * when a team came one short. One choice gives up every match of the
 * encounter still waiting for him, by walkover, as the sheet records it; one
 * tap takes the whole forfeit back.
 */
export const PlayerForfeit: React.FC<PlayerForfeitProps> = ({
  encounterId,
  matches,
  onRecord,
  setup
}) => {
  const translate = useTranslate()
  const [seatId, setSeatId] = useState<string | null>(null)
  const encounterMatches = matches.filter(
    (match) => match.encounterId === encounterId
  )
  const encounter = setup.encounters.find(
    (candidate) => candidate.id === encounterId
  )
  const format =
    encounter === undefined ? null : encounterFormatFor(encounter.formatId)
  /** A side's letters in the sheet's own order, A to F or X to T. */
  const inSheetOrder = (side: Side, letters: readonly string[]) => {
    const order =
      (side === 'home' ? format?.homeLetters : format?.awayLetters) ?? []

    return letters.toSorted(
      (one, other) => order.indexOf(one) - order.indexOf(other)
    )
  }
  const playerIds = new Set(
    encounterMatches.flatMap((match) => [
      ...match.home.playerIds,
      ...match.away.playerIds
    ])
  )
  const seats: SeatChoice[] = [
    ...setup.players
      .filter((player) => playerIds.has(player.id))
      .map(
        (player): SeatChoice => ({
          id: player.id,
          label: player.name,
          seat: { kind: 'player', playerId: player.id }
        })
      ),
    ...SIDES.flatMap((side) =>
      inSheetOrder(
        side,
        vacantLettersOf({ matches: encounterMatches, side })
      ).map(
        (letter): SeatChoice => ({
          id: `${side}:${letter}`,
          label: translate('organiser.forfeit.vacant', { letter }),
          seat: { kind: 'letter', letter, side }
        })
      )
    )
  ]
  const picked = seats.find((choice) => choice.id === seatId) ?? null
  const forfeited =
    picked === null
      ? []
      : forfeitedMatchesOf({ matches: encounterMatches, seat: picked.seat })
  const given = seats.flatMap((choice) => {
    const matchIds = walkoversOf({
      matches: encounterMatches,
      seat: choice.seat
    })

    return matchIds.length === 0 ? [] : [{ ...choice, matchIds }]
  })

  if (seats.length === 0) {
    return null
  }

  return (
    <div className='player-forfeit'>
      <div className='player-forfeit-declare'>
        <ChoiceField
          choices={seats}
          label={translate('organiser.forfeit.player')}
          onChange={setSeatId}
          placeholder={translate('organiser.choosePlayer')}
          selectedId={seatId}
        />
        {picked === null ? null : forfeited.length === 0 ? (
          <p className='organiser-note'>
            {translate('organiser.forfeit.none')}
          </p>
        ) : (
          <ConfirmButton
            confirmLabel={translate('organiser.forfeit.confirm', {
              count: forfeited.length,
              name: picked.label
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

              setSeatId(null)
            }}
          />
        )}
      </div>
      {given.length === 0 ? null : (
        <ul className='player-forfeit-given'>
          {given.map((choice) => (
            <li key={choice.id}>
              <Icon name='flag' />
              <span>
                {translate('organiser.forfeit.given', {
                  count: choice.matchIds.length,
                  name: choice.label
                })}
              </span>
              <Button
                onPress={() => {
                  for (const matchId of choice.matchIds) {
                    onRecord(matchId, {
                      id: newScoringEventId(),
                      type: 'score.undone'
                    })
                  }
                }}
                variant='quiet'
              >
                <Icon name='undo' />
                {translate('organiser.forfeit.undo')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
