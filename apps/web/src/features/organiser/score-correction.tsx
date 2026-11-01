import type React from 'react'
import { useState } from 'react'

import type { Player } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { MatchId } from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'
import { type Score, type Side, sides } from '@scoreboard/protocol/side'

import { sideName } from '@/features/event/participant-names'
import { newScoringEventId } from '@/infrastructure/ids'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { ConfirmButton } from './confirm-button'
import { type DraftGame, draftGamesOf, isDraftAccepted } from './score-draft'

import './score-correction.sass'

/** Past it a score is a slip of the finger: no game of table tennis goes that far. */
const MAX_POINTS = 99

const LOVE_ALL: Score = { away: 0, home: 0 }

type ScoreCorrectionProps = {
  match: MatchView
  /** Called once the corrected score is sent, so a panel can fold the editor. */
  onCorrected?: () => void
  onRecord: (matchId: MatchId, event: ScoringEvent) => void
  players: readonly Player[]
}

const shownPeriodsOf = (match: MatchView): Score[] => {
  const { current, periods } = match.state

  return current === null ? periods : [...periods, current]
}

const isSameScore = (left: readonly Score[], right: readonly Score[]) =>
  JSON.stringify(left) === JSON.stringify(right)

type PointStepperProps = {
  game: number
  name: string
  onChange: (points: number) => void
  points: number
  side: Side
}

/** One side's points in one game: a big minus, the figure, a big plus. */
const PointStepper: React.FC<PointStepperProps> = ({
  game,
  name,
  onChange,
  points,
  side
}) => {
  const translate = useTranslate()

  return (
    <fieldset className='point-stepper' data-side={side}>
      <legend className='visually-hidden'>
        {translate('organiser.correction.points', { game, name })}
      </legend>
      <Button
        aria-label={translate('organiser.correction.less', { name })}
        isDisabled={points === 0}
        onPress={() => onChange(points - 1)}
      >
        <Icon name='minus' />
      </Button>
      <output aria-live='polite' className='point-stepper-value'>
        {points}
      </output>
      <Button
        aria-label={translate('organiser.correction.more', { name })}
        isDisabled={points === MAX_POINTS}
        onPress={() => onChange(points + 1)}
      >
        <Icon name='plus' />
      </Button>
    </fieldset>
  )
}

const GameStatus: React.FC<{
  draft: DraftGame
  nameOf: (side: Side) => string
}> = ({ draft, nameOf }) => {
  const translate = useTranslate()

  switch (draft.kind) {
    case 'won':
      return (
        <p className='correction-game-status'>
          <Icon name='check' />
          {translate('organiser.correction.won', { name: nameOf(draft.side) })}
        </p>
      )
    case 'playing':
      return (
        <p className='correction-game-status'>
          {translate('organiser.correction.playing')}
        </p>
      )
    case 'impossible':
      return (
        <p className='correction-game-status' data-impossible>
          <Icon name='alert' />
          {translate('organiser.correction.impossible')}
        </p>
      )
  }
}

/**
 * The organiser's hand on a match, made for a finger on a tablet: every game
 * with each side's points on big minus and plus targets, a game swapped in one
 * tap, games added or taken off at the end, and the rules saying which game is
 * wrong before anything is sent. A match not started yet takes a walkover.
 */
export const ScoreCorrection: React.FC<ScoreCorrectionProps> = ({
  match,
  onCorrected,
  onRecord,
  players
}) => {
  const translate = useTranslate()
  const { state } = match
  const shownPeriods = shownPeriodsOf(match)
  const [draft, setDraft] = useState<Score[]>(
    shownPeriods.length === 0 ? [LOVE_ALL] : shownPeriods
  )
  const games = draftGamesOf(match.format, draft)
  const isAccepted = isDraftAccepted(match.format, draft)
  const isChanged = !isSameScore(draft, shownPeriods)
  const nameOf = (side: Side): string =>
    sideName({ form: 'short', participant: match[side], players }) ??
    translate('match.unnamedSide')

  if (state.status === 'scheduled') {
    return (
      <div className='correction-walkover'>
        <p>{translate('organiser.correction.walkoverExplain')}</p>
        <div className='correction-actions'>
          {sides.map((side) => (
            <ConfirmButton
              confirmLabel={translate(
                `organiser.correction.walkoverConfirm.${side}`
              )}
              key={side}
              label={translate(`organiser.correction.walkover.${side}`)}
              onConfirm={() =>
                onRecord(match.id, {
                  by: side,
                  id: newScoringEventId(),
                  reason: 'walkover',
                  type: 'match.conceded'
                })
              }
            />
          ))}
        </div>
      </div>
    )
  }

  const changeGame = (index: number, game: Score) =>
    setDraft(draft.map((period, at) => (at === index ? game : period)))

  return (
    <div className='score-correction'>
      <div aria-hidden className='correction-names'>
        {sides.map((side) => (
          <span key={side}>{nameOf(side)}</span>
        ))}
      </div>
      <ol className='correction-games'>
        {draft.map((period, index) => {
          const game = index + 1
          const status = games[index] ?? { kind: 'impossible' }

          return (
            <li
              className='correction-game'
              data-impossible={status.kind === 'impossible' || undefined}
              key={game}
            >
              <p className='correction-game-label'>
                {translate('organiser.correction.game', { game })}
              </p>
              {sides.map((side) => (
                <PointStepper
                  game={game}
                  key={side}
                  name={nameOf(side)}
                  onChange={(points) =>
                    changeGame(index, { ...period, [side]: points })
                  }
                  points={period[side]}
                  side={side}
                />
              ))}
              <Button
                aria-label={translate('organiser.correction.swap', { game })}
                className='correction-swap'
                onPress={() =>
                  changeGame(index, { away: period.home, home: period.away })
                }
                variant='quiet'
              >
                <Icon name='swap' />
              </Button>
              <GameStatus draft={status} nameOf={nameOf} />
            </li>
          )
        })}
      </ol>
      <div className='correction-actions'>
        <Button
          isDisabled={draft.length >= match.format.bestOf}
          onPress={() => setDraft([...draft, LOVE_ALL])}
        >
          <Icon name='plus' />
          {translate('organiser.correction.addGame')}
        </Button>
        <Button
          isDisabled={draft.length <= 1}
          onPress={() => setDraft(draft.slice(0, -1))}
          variant='quiet'
        >
          <Icon name='minus' />
          {translate('organiser.correction.removeGame')}
        </Button>
      </div>
      {isAccepted ? null : (
        <p className='correction-rule'>
          <Icon name='alert' />
          {translate('organiser.correction.rule', {
            points: match.format.pointsPerGame
          })}
        </p>
      )}
      <div className='correction-actions correction-submit'>
        <Button
          isDisabled={!state.canUndo}
          onPress={() =>
            onRecord(match.id, {
              id: newScoringEventId(),
              type: 'score.undone'
            })
          }
          variant='quiet'
        >
          <Icon name='undo' />
          {translate('organiser.correction.undo')}
        </Button>
        <Button
          isDisabled={!isAccepted || !isChanged}
          onPress={() => {
            onRecord(match.id, {
              id: newScoringEventId(),
              periods: draft,
              type: 'score.corrected'
            })
            onCorrected?.()
          }}
          variant='primary'
        >
          {translate('organiser.correction.submit')}
        </Button>
      </div>
    </div>
  )
}
