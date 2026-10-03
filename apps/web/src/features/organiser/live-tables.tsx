import type React from 'react'

import type { PublicSnapshot } from '@scoreboard/protocol/event-snapshot'
import type { MatchId } from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'

import { TableNumber } from '@/presentation/components/table-number'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { MatchRow } from './match-row'

type LiveTablesProps = {
  event: PublicSnapshot
  onRecord: (matchId: MatchId, event: ScoringEvent) => void
}

/** Every table and the match it is on right now, each one correctable in place. */
export const LiveTables: React.FC<LiveTablesProps> = ({ event, onRecord }) => {
  const translate = useTranslate()

  return (
    <ol className='organiser-list live-tables'>
      {event.tables.map((table) => {
        const match = event.matches.find(
          (candidate) => candidate.id === table.matchId
        )

        return (
          <li className='live-table' key={table.number}>
            <TableNumber number={table.number} />
            {match === undefined ? (
              <p className='organiser-row-text live-table-free'>
                {translate('organiser.live.free')}
              </p>
            ) : (
              <MatchRow
                match={match}
                onRecord={onRecord}
                players={event.players}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
