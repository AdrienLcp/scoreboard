import type React from 'react'
import { useState } from 'react'

import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { EventId, UmpireCode } from '@scoreboard/protocol/identifiers'
import { type Side, sides } from '@scoreboard/protocol/side'

import { opponentOf } from '@scoreboard/core/match/opponent'

import { formatDuration } from '@/features/event/durations'
import {
  encounterLinesFor,
  encounterTitleOf
} from '@/features/event/encounter-lines'
import { EncounterScore } from '@/features/event/encounter-score'
import { FeedMessage } from '@/features/event/feed-message'
import { hotSideOf, matchCallOf } from '@/features/event/match-call'
import { shortName, sideName } from '@/features/event/participant-names'
import { numberedPeriods } from '@/features/event/periods'
import { useServerNow } from '@/features/event/use-server-now'
import { toDate } from '@/infrastructure/dates'
import {
  useEventIdParam,
  useUmpireCodeParam
} from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { Main } from '@/presentation/components/main'
import { StatePill } from '@/presentation/components/state-pill'
import { TableNumber } from '@/presentation/components/table-number'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { recordRefusalKey } from '@/presentation/i18n/translation'

import { ConnectionBadge } from './connection-badge'
import { EndMatchPanel } from './end-match-panel'
import { lastPointSideOf, pointHistoryOf } from './point-history'
import { PointTarget } from './point-target'
import { useScoreShortcuts } from './use-score-shortcuts'
import { useUmpireConsole } from './use-umpire-console'

import './umpire-page.sass'

const RECENT_POINTS_SHOWN = 8

/** "3–1": games won by the winner first, however the sides are listed. */
const gamesLine = ({ away, home }: { away: number; home: number }): string =>
  `${Math.max(home, away)}–${Math.min(home, away)}`

const UmpireConsole: React.FC<{ code: UmpireCode; eventId: EventId }> = ({
  code,
  eventId
}) => {
  const translate = useTranslate()
  const umpire = useUmpireConsole({ code, eventId })
  const { events, match, snapshot, state } = umpire
  const nowMs = useServerNow(snapshot?.event.generatedAtMs ?? null)
  const [isFlipped, setIsFlipped] = useState(false)

  const isSwapped = (state?.endsSwapped ?? false) !== isFlipped
  const order: readonly [Side, Side] = isSwapped
    ? ['away', 'home']
    : ['home', 'away']
  const isLive = state?.status === 'live'
  const history = match === null ? [] : pointHistoryOf(match.format, events)

  useScoreShortcuts({
    isEnabled: isLive,
    onPoint: umpire.score,
    onUndo: () => {
      if (state?.canUndo) {
        umpire.undo()
      }
    },
    order
  })

  if (snapshot === null) {
    return (
      <FeedMessage
        error={umpire.error}
        status={umpire.status}
        title={translate('umpire.title')}
      />
    )
  }

  const { players } = snapshot.event
  const tableTitle = translate('table.name', { number: snapshot.table })
  const nameIn = (shown: MatchView, side: Side): string =>
    sideName({ form: 'full', participant: shown[side], players }) ??
    translate('match.unnamedSide')
  const nameOf = (side: Side): string =>
    match === null ? '' : nameIn(match, side)
  const encounter = encounterLinesFor(snapshot.event).find(
    (line) => line.id === match?.encounterId
  )
  const subtitle = [
    encounter === undefined ? null : encounterTitleOf(encounter),
    match?.label ?? null,
    match === null
      ? null
      : translate('match.gamesToWin', {
          count: Math.ceil(match.format.bestOf / 2)
        })
  ]
    .filter((part) => part !== null)
    .join(' · ')
  const call =
    match === null || state === null
      ? null
      : matchCallOf({ format: match.format, state })
  const lastSide = lastPointSideOf(history)
  const lastFinished = snapshot.event.matches.findLast(
    (candidate) =>
      candidate.table === snapshot.table &&
      candidate.state.status === 'finished' &&
      candidate.id !== match?.id
  )
  const lastWinner = lastFinished?.state.winner ?? null

  return (
    <Main className='umpire-console'>
      <DocumentTitle>
        {`${tableTitle} — ${translate('umpire.title')}`}
      </DocumentTitle>
      <header className='umpire-header'>
        <div className='umpire-identity'>
          <TableNumber number={snapshot.table} />
          <div>
            <h1>{tableTitle}</h1>
            {subtitle === '' ? null : <p>{subtitle}</p>}
          </div>
        </div>
        <ConnectionBadge pending={umpire.pendingCount} status={umpire.status} />
      </header>

      {umpire.refusal === null ? null : (
        <p className='umpire-alert' role='alert'>
          <Icon name='alert' />
          {translate(recordRefusalKey(umpire.refusal))}
        </p>
      )}

      {match === null || state === null ? (
        <section className='umpire-idle'>
          <h2>{translate('umpire.idle.title')}</h2>
          <p>{translate('umpire.idle.explain')}</p>
        </section>
      ) : null}

      {match !== null && state?.status === 'scheduled' ? (
        <section className='umpire-start'>
          <p className='umpire-start-match'>
            {`${nameOf('home')} – ${nameOf('away')}`}
          </p>
          <h2>{translate('umpire.start.title')}</h2>
          <div className='umpire-start-choices'>
            {sides.map((side) => (
              <Button
                key={side}
                onPress={() => umpire.start(side)}
                variant='primary'
              >
                <Icon name='serve' />
                {nameOf(side)}
              </Button>
            ))}
          </div>
          {lastFinished === undefined || lastWinner === null ? null : (
            <p className='umpire-start-last'>
              {translate('umpire.start.last', {
                games: gamesLine(lastFinished.state.periodsWon),
                loser: nameIn(lastFinished, opponentOf(lastWinner)),
                winner: nameIn(lastFinished, lastWinner)
              })}
            </p>
          )}
        </section>
      ) : null}

      {match !== null && state !== null && state.status !== 'scheduled' ? (
        <div className='umpire-main'>
          <div className='umpire-play'>
            <div className='umpire-games'>
              {numberedPeriods(state.periods).map((period) => {
                const left = period[order[0]]
                const right = period[order[1]]

                return (
                  <span className='game-chip' key={period.number}>
                    <small>
                      {translate('umpire.gameShort', { number: period.number })}
                    </small>
                    <span>
                      {left > right ? <b>{left}</b> : left}–
                      {right > left ? <b>{right}</b> : right}
                    </span>
                  </span>
                )
              })}
              {state.current === null ? null : (
                <span className='game-chip current'>
                  {translate('umpire.gameOn', {
                    number: state.periods.length + 1
                  })}
                </span>
              )}
              {match.timing.startedAtMs === null ? null : (
                <span className='umpire-elapsed'>
                  {translate('umpire.startedAt', {
                    at: toDate(match.timing.startedAtMs),
                    elapsed: formatDuration(
                      translate,
                      nowMs - match.timing.startedAtMs
                    )
                  })}
                </span>
              )}
            </div>

            <div aria-live='polite' className='umpire-call'>
              {state.status === 'finished' ? (
                <p className='umpire-finished'>
                  <Icon name='check' />
                  {translate('umpire.finished', {
                    games: gamesLine(state.periodsWon),
                    name: nameOf(state.winner ?? 'home')
                  })}
                </p>
              ) : null}
              {call === null ? null : (
                <StatePill key={call.kind} tone={call.kind}>
                  {call.kind === 'deuce'
                    ? translate('umpire.deuce')
                    : `${translate(`match.call.${call.kind}`)} · ${shortName(nameOf(call.side))}`}
                </StatePill>
              )}
            </div>

            {isLive && state.current !== null ? (
              <div className='umpire-targets'>
                {order.map((side, position) => (
                  <PointTarget
                    gamesWon={state.periodsWon[side]}
                    isHot={hotSideOf(call) === side}
                    isServing={state.serving === side}
                    key={side}
                    keyHint={position === 0 ? 'arrowLeft' : 'arrowRight'}
                    name={nameOf(side)}
                    onPoint={() => umpire.score(side)}
                    score={state.current?.[side] ?? 0}
                    serveTurn={state.serveTurn}
                  />
                ))}
              </div>
            ) : null}

            <Button
              className='umpire-undo'
              isDisabled={!state.canUndo}
              onPress={umpire.undo}
            >
              <Icon name='undo' />
              <span>
                {translate('umpire.undo')}
                {lastSide === null ? null : (
                  <small>{` (${shortName(nameOf(lastSide))})`}</small>
                )}
              </span>
            </Button>
          </div>

          <aside className='umpire-aside'>
            {encounter === undefined ? null : (
              <section className='umpire-card'>
                <h2>{translate('umpire.encounter')}</h2>
                <EncounterScore encounter={encounter} />
              </section>
            )}
            <section className='umpire-card umpire-log'>
              <h2>{translate('umpire.recent')}</h2>
              {history.length === 0 ? (
                <p className='umpire-hint'>{translate('umpire.noPoints')}</p>
              ) : (
                <ol>
                  {history.slice(0, RECENT_POINTS_SHOWN).map((point) => (
                    <li
                      data-undone={point.isUndone || undefined}
                      key={point.id}
                    >
                      <span>
                        {translate('umpire.pointFor', {
                          name: shortName(nameOf(point.side))
                        })}
                      </span>
                      <b>
                        {point.scoreAfter === null
                          ? translate('umpire.matchOver')
                          : `${point.scoreAfter[order[0]]}–${point.scoreAfter[order[1]]}`}
                      </b>
                    </li>
                  ))}
                </ol>
              )}
            </section>
            <section className='umpire-card umpire-keys'>
              <h2>{translate('umpire.keys.title')}</h2>
              <p>
                <kbd>
                  <Icon name='arrowLeft' />
                </kbd>
                <kbd>
                  <Icon name='arrowRight' />
                </kbd>
                {translate('umpire.keys.points')}
              </p>
              <p>
                <kbd>{translate('umpire.keys.backspace')}</kbd>
                {translate('umpire.keys.undo')}
              </p>
            </section>
            <section
              aria-label={translate('umpire.end.section')}
              className='umpire-end'
            >
              <Button onPress={() => setIsFlipped((current) => !current)}>
                <Icon name='swap' />
                {translate('umpire.swap')}
              </Button>
              {isLive ? (
                <EndMatchPanel nameOf={nameOf} onConcede={umpire.concede} />
              ) : null}
            </section>
          </aside>
        </div>
      ) : null}
    </Main>
  )
}

/** One table's console: an umpire scores the match on it, point by point. */
export const UmpirePage: React.FC = () => {
  const translate = useTranslate()
  const eventId = useEventIdParam()
  const code = useUmpireCodeParam()

  if (eventId === null || code === null) {
    return (
      <FeedMessage
        message={translate('error.wrong_code')}
        title={translate('umpire.title')}
      />
    )
  }

  return <UmpireConsole code={code} eventId={eventId} />
}
