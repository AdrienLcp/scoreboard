import type React from 'react'

import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { EventId } from '@scoreboard/protocol/identifiers'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'
import { sides } from '@scoreboard/protocol/side'
import type { WallView } from '@scoreboard/protocol/wall-view'

import { hallPlanOf } from '@scoreboard/core/hall/hall-plan'

import { sideName } from '@/features/event/participant-names'
import type { TeamPaint } from '@/features/event/team-paint'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { WallJoin } from './wall-join'
import type { WallTable as WallTableModel } from './wall-rows'
import { WallTable } from './wall-table'
import {
  poolNumberOf,
  tournamentPaintOf,
  type WallStanding,
  type WallTournamentRow
} from './wall-tournament'
import { wallFloorOn } from './wall-view'

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

/** Past this many lines, with its title, a pool's table tightens its type to keep each line whole. */
const LONG_PANEL_LINES = 9

/** The lines a panel's list takes, so the pools down the hall's left share its height by their length. */
const panelWeightOf = (row: WallTournamentRow): number =>
  (row.kind === 'pool' ? row.standings.length : row.matches.length) + 1

/** A pool's table, or the final phase's matches, at the head of its row or down the hall's left. */
const WallPoolPanel: React.FC<{
  row: WallTournamentRow
  snapshot: PublicSnapshot
  style?: React.CSSProperties
}> = ({ row, snapshot, style }) => {
  const translate = useTranslate()

  return (
    <div
      className='wall-pool'
      data-long={panelWeightOf(row) > LONG_PANEL_LINES || undefined}
      style={style}
    >
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
            <WallBracketLine key={match.id} match={match} snapshot={snapshot} />
          ))}
        </ol>
      )}
    </div>
  )
}

type WallTournamentBoardProps = {
  eventId: EventId
  nowMs: InstantMs
  rows: readonly WallTournamentRow[]
  snapshot: PublicSnapshot
  spectatorUrl: string
  /** The layout this screen asked for; `null` leaves it to the plan. */
  view: WallView | null
}

/**
 * The wall of a Top 12 day. As the hall when the screen does not ask for
 * rows and its plan holds the tables: the
 * pools down the left, each table where it stands with its pool in its call,
 * the QR in a free place or its own column. Otherwise one row per pool with
 * its table then its tables, four side by side at most, the final phase below
 * once it begins, the QR in its column.
 */
export const WallTournamentBoard: React.FC<WallTournamentBoardProps> = ({
  eventId,
  nowMs,
  rows,
  snapshot,
  spectatorUrl,
  view
}) => {
  const translate = useTranslate()
  const floor = wallFloorOn({
    plan: hallPlanOf(snapshot),
    tables: rows.flatMap((row) => row.tables.map(({ table }) => table)),
    view
  })

  const tableOf = (
    row: WallTournamentRow,
    wallTable: WallTableModel,
    isOnFloor: boolean
  ) => (
    <WallTable
      encounterMatches={row.matches}
      key={wallTable.table}
      lettersOf={(match, side) => poolNumberOf(snapshot, match, side)}
      nowMs={nowMs}
      paintOf={(match, side) => tournamentPaintOf(snapshot, match, side)}
      players={snapshot.players}
      tagOf={
        isOnFloor && row.kind === 'pool'
          ? () => translate('display.wall.pool', { name: row.name })
          : undefined
      }
      wallTable={wallTable}
    />
  )

  if (floor !== null) {
    return (
      <div
        className='wall-board'
        data-floor
        data-hall={floor.join === null ? undefined : true}
        data-tournament
        style={{ '--columns': floor.columns, '--rows': floor.rows }}
      >
        <div className='wall-pools'>
          {rows.map((row) => (
            <WallPoolPanel
              key={row.id}
              row={row}
              snapshot={snapshot}
              style={{ '--weight': panelWeightOf(row) }}
            />
          ))}
        </div>
        {rows.flatMap((row) =>
          row.tables.map((wallTable) => {
            const place = floor.places.get(wallTable.table)

            return (
              <div
                className='wall-floor-place'
                key={wallTable.table}
                style={{
                  '--area-column': (place?.column ?? 1) + 1,
                  '--area-row': place?.row ?? 1
                }}
              >
                {tableOf(row, wallTable, true)}
              </div>
            )
          })
        )}
        <WallJoin
          eventId={eventId}
          spectatorUrl={spectatorUrl}
          style={
            floor.join === null
              ? undefined
              : {
                  '--area-column': floor.join.column + 1,
                  '--area-columns': 1,
                  '--area-row': floor.join.row,
                  '--area-rows': 1
                }
          }
        />
      </div>
    )
  }

  return (
    <div
      className='wall-board'
      data-tournament
      style={{ '--rows': rows.reduce((sum, row) => sum + row.lines, 0) }}
    >
      {rows.map((row) => (
        <section
          className='wall-row'
          key={row.id}
          style={{
            '--cells': Math.ceil(row.tables.length / row.lines),
            '--lines': row.lines
          }}
        >
          <WallPoolPanel row={row} snapshot={snapshot} />
          {row.tables.map((wallTable) => tableOf(row, wallTable, false))}
        </section>
      ))}
      <WallJoin eventId={eventId} spectatorUrl={spectatorUrl} />
    </div>
  )
}
