import type React from 'react'
import { useState } from 'react'

import type { Player, Team } from '@scoreboard/protocol/event-setup'
import type {
  EncounterView,
  MatchView
} from '@scoreboard/protocol/event-snapshot'
import type { PlayerId } from '@scoreboard/protocol/identifiers'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'
import { type Side, sides } from '@scoreboard/protocol/side'

import { paintOf } from '@/features/event/team-paint'
import { PlainButton } from '@/presentation/components/button'
import {
  Disclosure,
  DisclosurePanel
} from '@/presentation/components/disclosure'
import { Icon } from '@/presentation/components/icon'
import { RollingNumber } from '@/presentation/components/rolling-number'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { encounterTotalsOf, type TeamTotals } from './encounter-totals'
import { MatchCard } from './match-card'

import './encounter-sheet-card.sass'

type EncounterSheetCardProps = {
  followed: readonly PlayerId[]
  isOpenAtFirst: boolean
  /** The encounter's matches, in the sheet's order. */
  matches: readonly MatchView[]
  nowMs: InstantMs
  onFollow: (playerId: PlayerId, isFollowing: boolean) => void
  players: readonly Player[]
  teams: Record<Side, Team | undefined>
  view: EncounterView | undefined
}

const TOTAL_ROWS: readonly (keyof TeamTotals)[] = ['parties', 'games', 'points']

/**
 * One team encounter on a visitor's phone, as the wall paints it: both teams
 * on their colours with the parties won, the matches under way, and the whole
 * sheet line by line when opened, added up at its foot once it is over.
 */
export const EncounterSheetCard: React.FC<EncounterSheetCardProps> = ({
  followed,
  isOpenAtFirst,
  matches,
  nowMs,
  onFollow,
  players,
  teams,
  view
}) => {
  const translate = useTranslate()
  const [isExpanded, setIsExpanded] = useState(isOpenAtFirst)
  const points = view?.points ?? { away: 0, home: 0 }
  const live = matches.filter((match) => match.state.status === 'live')
  const finishedCount = matches.filter(
    (match) => match.state.status === 'finished'
  ).length
  const tables = [
    ...new Set(
      matches.flatMap((match) => (match.table === null ? [] : [match.table]))
    )
  ].toSorted((left, right) => left - right)
  const isOver = view?.outcome !== null && view?.outcome !== undefined
  const totals = encounterTotalsOf(matches)
  const card = (match: MatchView) => (
    <MatchCard
      encounterMatches={matches}
      encounterTitle={null}
      followed={followed}
      key={match.id}
      match={match}
      nowMs={nowMs}
      onFollow={onFollow}
      players={players}
    />
  )

  return (
    <Disclosure
      className='sheet-card'
      isExpanded={isExpanded}
      onExpandedChange={setIsExpanded}
    >
      <PlainButton className='sheet-card-head' slot='trigger'>
        {sides.map((side) => {
          const paint = paintOf(teams[side])
          const isLoser =
            isOver && view?.outcome !== 'draw' && view?.outcome !== side

          return (
            <span
              className='sheet-team'
              data-lost={isLoser || undefined}
              data-white={paint.isWhite || undefined}
              key={side}
              style={{ '--on-team': paint.textColour, '--team': paint.colour }}
            >
              <span className='sheet-team-name'>{paint.name}</span>
              <span className='sheet-team-score'>
                <RollingNumber value={points[side]} />
              </span>
            </span>
          )
        })}
        <span className='sheet-card-status'>
          <span>
            {[
              tables.length === 0
                ? null
                : translate('spectator.sheet.tables', {
                    count: tables.length,
                    tables: tables.map(String)
                  }),
              isOver
                ? translate('spectator.sheet.over')
                : translate('spectator.sheet.progress', {
                    done: finishedCount,
                    total: matches.length
                  })
            ]
              .filter((part) => part !== null)
              .join(' · ')}
          </span>
          <span className='sheet-card-toggle'>
            {translate(
              isExpanded ? 'spectator.sheet.hide' : 'spectator.sheet.show'
            )}
            <Icon className='sheet-card-chevron' name='chevronDown' />
          </span>
        </span>
      </PlainButton>
      {isExpanded || live.length === 0 ? null : (
        <div className='sheet-card-lines'>{live.map(card)}</div>
      )}
      <DisclosurePanel>
        <div className='sheet-card-lines'>{matches.map(card)}</div>
        {isOver ? (
          <table className='sheet-totals'>
            <caption className='visually-hidden'>
              {translate('spectator.sheet.totals')}
            </caption>
            <thead>
              <tr>
                <td />
                {sides.map((side) => (
                  <th key={side} scope='col'>
                    {paintOf(teams[side]).name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TOTAL_ROWS.map((row) => (
                <tr key={row}>
                  <th scope='row'>{translate(`spectator.sheet.${row}`)}</th>
                  {sides.map((side) => (
                    <td key={side}>{totals[side][row]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </DisclosurePanel>
    </Disclosure>
  )
}
