import type React from 'react'

import type { Player } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'
import type { Side } from '@scoreboard/protocol/side'

import { opponentOf } from '@scoreboard/core/match/opponent'

import type { EncounterLine } from '@/features/event/encounter-lines'
import { EncounterScore } from '@/features/event/encounter-score'
import { sideName } from '@/features/event/participant-names'
import { startLabel } from '@/features/event/start-label'
import { toDate } from '@/infrastructure/dates'
import { QrCode } from '@/presentation/components/qr-code'
import { TableNumber } from '@/presentation/components/table-number'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { DisplaySummary } from './display-summary'

import './summary-column.sass'

type SummaryColumnProps = {
  encounters: readonly EncounterLine[]
  encounterTitleFor: (match: MatchView) => string | null
  nowMs: InstantMs
  players: readonly Player[]
  spectatorUrl: string
  summary: DisplaySummary
}

const ResultItem: React.FC<{
  match: MatchView
  players: readonly Player[]
}> = ({ match, players }) => {
  const translate = useTranslate()
  const winner = match.state.winner ?? 'home'
  const loser = opponentOf(winner)
  const nameOf = (side: Side): string =>
    sideName({ form: 'short', participant: match[side], players }) ??
    translate('match.unnamedSide')
  const won = match.state.periodsWon[winner]
  const lost = match.state.periodsWon[loser]
  const { concession } = match.state
  const finishedAt = toDate(match.timing.finishedAtMs ?? 0)

  return (
    <li className='result-item'>
      <TableNumber number={match.table ?? 0} />
      <span className='result-winner'>{nameOf(winner)}</span>
      {concession === null ? (
        <span className='result-score'>{`${won}–${lost}`}</span>
      ) : (
        <span className='result-concession'>
          {translate(`match.concession.${concession.reason}`)}
        </span>
      )}
      <span className='result-detail'>
        {translate('display.resultDetail', {
          at: finishedAt,
          loser: nameOf(loser)
        })}
      </span>
    </li>
  )
}

/** Everything that is not being played, in one calm column beside the live tiles. */
export const SummaryColumn: React.FC<SummaryColumnProps> = ({
  encounters,
  encounterTitleFor,
  nowMs,
  players,
  spectatorUrl,
  summary
}) => {
  const translate = useTranslate()
  // The non-breaking space keeps the dash on the home line, so a wrap never starts a line with it.
  const namesOf = (match: MatchView): string =>
    [match.home, match.away]
      .map(
        (participant) =>
          sideName({ form: 'full', participant, players }) ??
          translate('match.unnamedSide')
      )
      .join(' – ')

  return (
    <aside aria-label={translate('display.summary')} className='summary-column'>
      {encounters.length === 0 ? null : (
        <section className='summary-block'>
          <h2>{translate('display.encounters')}</h2>
          {encounters.map((encounter) => (
            <EncounterScore encounter={encounter} key={encounter.id} />
          ))}
        </section>
      )}
      <section className='summary-block grows'>
        <h2>{translate('display.results')}</h2>
        {summary.results.length === 0 ? (
          <p className='summary-empty'>{translate('display.noResults')}</p>
        ) : (
          <ol className='summary-list'>
            {summary.results.map((match) => (
              <ResultItem key={match.id} match={match} players={players} />
            ))}
          </ol>
        )}
      </section>
      <section className='summary-block'>
        <h2>{translate('display.freeTables')}</h2>
        {summary.freeTables.length === 0 ? (
          <p className='summary-empty'>{translate('display.noFreeTables')}</p>
        ) : (
          <ol className='free-tables'>
            {summary.freeTables.map(({ nextAtMs, table }) => (
              <li data-waiting={nextAtMs === null || undefined} key={table}>
                <TableNumber number={table} />
                <span>
                  {nextAtMs === null
                    ? translate('display.nothingNext')
                    : startLabel({ nowMs, startMs: nextAtMs, translate })}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
      {summary.next.length === 0 ? null : (
        <section className='summary-block grows yields'>
          <h2>{translate('display.next')}</h2>
          <ol className='summary-list'>
            {summary.next.map((match) => {
              const start =
                match.timing.estimatedStartMs ?? match.plannedAtMs ?? 0

              return (
                <li className='next-item' key={match.id}>
                  <span className='next-time'>
                    {startLabel({ nowMs, startMs: start, translate })}
                  </span>
                  <span className='next-names'>{namesOf(match)}</span>
                  <span className='next-detail'>
                    {[
                      translate('table.name', { number: match.table ?? 0 }),
                      encounterTitleFor(match),
                      match.label
                    ]
                      .filter((part) => part !== null)
                      .join(' · ')}
                  </span>
                </li>
              )
            })}
          </ol>
        </section>
      )}
      <section className='summary-qr'>
        <QrCode label={translate('display.qrLabel')} url={spectatorUrl} />
        <div>
          <p>{translate('display.follow')}</p>
          <small>{spectatorUrl.replace(/^https?:\/\//, '')}</small>
        </div>
      </section>
    </aside>
  )
}
