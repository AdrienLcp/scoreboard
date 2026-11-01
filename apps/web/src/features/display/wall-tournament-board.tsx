import type React from 'react'

import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { EventId } from '@scoreboard/protocol/identifiers'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'
import { sides } from '@scoreboard/protocol/side'

import { sideName } from '@/features/event/participant-names'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { WallJoin } from './wall-join'
import type { TeamPaint } from './wall-rows'
import { WallTable } from './wall-table'
import {
  poolNumberOf,
  tournamentPaintOf,
  type WallStanding,
  type WallTournamentRow
} from './wall-tournament'

import './wall-board.sass'
import './wall-tournament-board.sass'

/** The two best of each pool go through to the semi-finals. */
const QUALIFIED_RANK = 2

const teamStyle = (paint: TeamPaint): React.CSSProperties => ({
  '--on-team': paint.textColour,
  '--team': paint.colour
})

const WallPoolLine: React.FC<{
  hasResults: boolean
  standing: WallStanding
}> = ({ hasResults, standing }) => {
  const translate = useTranslate()

  return (
    <li
      className='wall-standing'
      data-qualified={
        (hasResults && standing.rank <= QUALIFIED_RANK) || undefined
      }
    >
      <span className='wall-standing-rank'>{standing.rank}</span>
      <span
        className='wall-standing-mark'
        data-white={standing.paint.isWhite || undefined}
        style={teamStyle(standing.paint)}
      >
        {standing.logoUrl === null ? (
          standing.number
        ) : (
          <img alt='' src={standing.logoUrl} />
        )}
      </span>
      <span className='wall-standing-name'>
        {standing.name}
        <small>{standing.paint.name}</small>
      </span>
      <b className='wall-standing-points'>
        <span aria-hidden='true'>{standing.points}</span>
        <span className='visually-hidden'>
          {translate('display.wall.poolPoints', { points: standing.points })}
        </span>
      </b>
    </li>
  )
}

const WallBracketLine: React.FC<{
  match: MatchView
  snapshot: PublicSnapshot
}> = ({ match, snapshot }) => {
  const translate = useTranslate()
  const isPlayed = match.state.status !== 'scheduled'

  return (
    <li className='wall-bracket-line' data-status={match.state.status}>
      <span className='wall-bracket-label'>{match.label}</span>
      {sides.map((side) => (
        <span
          className='wall-bracket-side'
          key={side}
          style={teamStyle(tournamentPaintOf(snapshot, match, side))}
        >
          <i aria-hidden='true' className='wall-bracket-swatch' />
          <span className='wall-bracket-name'>
            {sideName({
              form: 'full',
              participant: match[side],
              players: snapshot.players
            }) ?? translate('match.unnamedSide')}
          </span>
          {isPlayed ? (
            <b className='wall-bracket-games'>{match.state.periodsWon[side]}</b>
          ) : null}
        </span>
      ))}
    </li>
  )
}

type WallTournamentBoardProps = {
  eventId: EventId
  nowMs: InstantMs
  rows: readonly WallTournamentRow[]
  snapshot: PublicSnapshot
  spectatorUrl: string
}

/**
 * The wall of a Top 12 day: each pool with its table, every player on his
 * club's colour, beside the tables it plays on; the final phase below once
 * it begins; the spectators' QR in its column.
 */
export const WallTournamentBoard: React.FC<WallTournamentBoardProps> = ({
  eventId,
  nowMs,
  rows,
  snapshot,
  spectatorUrl
}) => {
  const translate = useTranslate()

  return (
    <div
      className='wall-board'
      data-tournament
      style={{ '--rows': rows.length }}
    >
      {rows.map((row) => (
        <section
          className='wall-row'
          key={row.id}
          style={{ '--cells': row.tables.length }}
        >
          <div className='wall-pool'>
            <h2 className='wall-pool-title'>
              {row.kind === 'pool'
                ? translate('display.wall.pool', { name: row.name })
                : translate('display.wall.finalPhase')}
              {row.kind === 'pool' && row.isComplete ? (
                <small>{translate('display.wall.poolComplete')}</small>
              ) : null}
            </h2>
            {row.kind === 'pool' ? (
              <ol className='wall-standings'>
                {row.standings.map((standing) => (
                  <WallPoolLine
                    hasResults={row.hasResults}
                    key={standing.playerId}
                    standing={standing}
                  />
                ))}
              </ol>
            ) : (
              <ol className='wall-bracket'>
                {row.matches.map((match) => (
                  <WallBracketLine
                    key={match.id}
                    match={match}
                    snapshot={snapshot}
                  />
                ))}
              </ol>
            )}
          </div>
          {row.tables.map((wallTable) => (
            <WallTable
              encounterMatches={row.matches}
              key={wallTable.table}
              lettersOf={(match, side) => poolNumberOf(snapshot, match, side)}
              nowMs={nowMs}
              paintOf={(match, side) =>
                tournamentPaintOf(snapshot, match, side)
              }
              players={snapshot.players}
              wallTable={wallTable}
            />
          ))}
        </section>
      ))}
      <WallJoin eventId={eventId} spectatorUrl={spectatorUrl} />
    </div>
  )
}
