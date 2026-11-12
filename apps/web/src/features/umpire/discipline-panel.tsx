import type React from 'react'
import { useState } from 'react'

import type { TimeoutCall } from '@scoreboard/protocol/event-snapshot'
import type { PlayerId } from '@scoreboard/protocol/identifiers'
import type { MatchCard, MatchState } from '@scoreboard/protocol/match-state'
import type { CardPenalty } from '@scoreboard/protocol/scoring-event'
import type { Side } from '@scoreboard/protocol/side'

import { runningTimeoutOf } from '@scoreboard/core/discipline/timeout-clock'
import { opponentOf } from '@scoreboard/core/match/opponent'

import { useUmpireTranslate } from '@/features/umpire/use-umpire-translate'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'

import './discipline-panel.sass'

const SECOND_MS = 1000

type CardDraft = { playerId: PlayerId | null; side: Side }

type DisciplinePanelProps = {
  lastTimeout: TimeoutCall | null
  nameOf: (side: Side) => string
  nowMs: number
  onCallTimeout: (side: Side) => void
  onShowCard: (card: CardDraft & { penalty: CardPenalty }) => void
  onWithdrawCard: (cardId: string) => void
  onWithdrawTimeout: (side: Side) => void
  /** The sides as the screen shows them, left first. */
  order: readonly [Side, Side]
  penaltyFor: (draft: CardDraft) => CardPenalty
  /** Who plays for each side: one player, a pair, or nobody named yet. */
  playersOf: (side: Side) => readonly { id: PlayerId; name: string }[]
  state: MatchState
}

const cardKeyOf = (penalty: CardPenalty) =>
  penalty === 0 ? 'umpire.card.yellow' : 'umpire.card.yellowRed'

/**
 * Time-outs and cards, kept in their own row away from the point targets. A
 * card takes a second tap that names the player and the penalty, and every
 * one of them can be taken back later.
 */
export const DisciplinePanel: React.FC<DisciplinePanelProps> = ({
  lastTimeout,
  nameOf,
  nowMs,
  onCallTimeout,
  onShowCard,
  onWithdrawCard,
  onWithdrawTimeout,
  order,
  penaltyFor,
  playersOf,
  state
}) => {
  const translate = useUmpireTranslate()
  const [cardSide, setCardSide] = useState<Side | null>(null)
  const running = runningTimeoutOf({ lastTimeout, nowMs })
  const isPlaying = state.status === 'live'

  const confirmCard = (draft: CardDraft): void => {
    onShowCard({ ...draft, penalty: penaltyFor(draft) })
    setCardSide(null)
  }

  const cardLine = (card: MatchCard): string => {
    const label = translate(cardKeyOf(card.penalty))
    const player = playersOf(card.side).find(({ id }) => id === card.playerId)

    return player === undefined ? label : `${label} · ${player.name}`
  }

  return (
    <section
      aria-label={translate('umpire.discipline.section')}
      className='discipline-panel'
    >
      {order.map((side) => {
        const isRunning = running?.side === side && state.timeouts[side]
        const cards = state.cards.filter((card) => card.side === side)

        return (
          <div className='discipline-side' key={side}>
            <h2>{nameOf(side)}</h2>

            {state.timeouts[side] ? (
              <p className='discipline-badge' data-running={isRunning}>
                <Icon name='timer' />
                {isRunning && running !== null
                  ? translate('umpire.timeout.running', {
                      seconds: Math.ceil(running.remainingMs / SECOND_MS)
                    })
                  : translate('umpire.timeout.used')}
                <Button
                  className='discipline-withdraw'
                  onPress={() => onWithdrawTimeout(side)}
                >
                  {translate('umpire.discipline.withdraw')}
                </Button>
              </p>
            ) : (
              <Button
                isDisabled={!isPlaying}
                onPress={() => onCallTimeout(side)}
              >
                <Icon name='timer' />
                {translate('umpire.timeout.call')}
              </Button>
            )}

            {cards.map((card) => (
              <p
                className='discipline-badge'
                data-card={card.penalty === 0 ? 'yellow' : 'red'}
                key={card.id}
              >
                <Icon name='card' />
                {cardLine(card)}
                <Button
                  className='discipline-withdraw'
                  onPress={() => onWithdrawCard(card.id)}
                >
                  {translate('umpire.discipline.withdraw')}
                </Button>
              </p>
            ))}

            {cardSide === side ? (
              <CardConfirmation
                nameOf={nameOf}
                onCancel={() => setCardSide(null)}
                onConfirm={confirmCard}
                penaltyFor={penaltyFor}
                players={playersOf(side)}
                side={side}
              />
            ) : (
              <Button isDisabled={!isPlaying} onPress={() => setCardSide(side)}>
                <Icon name='card' />
                {translate('umpire.card.give')}
              </Button>
            )}
          </div>
        )
      })}
    </section>
  )
}

const CardConfirmation: React.FC<{
  nameOf: (side: Side) => string
  onCancel: () => void
  onConfirm: (draft: CardDraft) => void
  penaltyFor: (draft: CardDraft) => CardPenalty
  players: readonly { id: PlayerId; name: string }[]
  side: Side
}> = ({ nameOf, onCancel, onConfirm, penaltyFor, players, side }) => {
  const translate = useUmpireTranslate()
  const choices =
    players.length === 0
      ? [{ id: null, name: nameOf(side) }]
      : players.map(({ id, name }) => ({ id, name }))

  return (
    <div className='discipline-confirm'>
      {choices.map(({ id, name }) => {
        const penalty = penaltyFor({ playerId: id, side })

        return (
          <Button
            key={id ?? side}
            onPress={() => onConfirm({ playerId: id, side })}
            variant='primary'
          >
            <Icon name='card' />
            {penalty === 0
              ? translate('umpire.card.confirmYellow', { name })
              : translate('umpire.card.confirmYellowRed', {
                  name,
                  opponent: nameOf(opponentOf(side)),
                  points: penalty
                })}
          </Button>
        )
      })}
      <Button onPress={onCancel}>{translate('umpire.card.cancel')}</Button>
    </div>
  )
}
