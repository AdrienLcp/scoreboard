import type React from 'react'

import type { PublicSnapshot } from '@scoreboard/protocol/event-snapshot'
import type { EventId } from '@scoreboard/protocol/identifiers'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'
import type { WallView } from '@scoreboard/protocol/wall-view'

import { hallPlanOf } from '@scoreboard/core/hall/hall-plan'

import { WallEncounter } from './wall-encounter'
import type { WallArea } from './wall-hall'
import { WallJoin } from './wall-join'
import type { WallRow } from './wall-rows'
import { WallTable } from './wall-table'
import { wallHallOn } from './wall-view'

import './wall-board.sass'

type WallBoardProps = {
  eventId: EventId
  nowMs: InstantMs
  rows: readonly WallRow[]
  snapshot: PublicSnapshot
  spectatorUrl: string
  /** The layout this screen asked for; `null` leaves it to the plan. */
  view: WallView | null
}

const areaStyle = (area: WallArea): React.CSSProperties => ({
  '--area-column': area.column,
  '--area-columns': area.columnSpan,
  '--area-row': area.row,
  '--area-rows': area.rowSpan
})

/**
 * The club's wall: each encounter with its teams then its tables, every
 * table always in its place, and the way onto the spectators' page. Laid out
 * as the hall when the screen does not ask for rows and its plan holds every
 * encounter, the QR in a free place; one row per encounter otherwise, the QR
 * in a column beside.
 */
export const WallBoard: React.FC<WallBoardProps> = ({
  eventId,
  nowMs,
  rows,
  snapshot,
  spectatorUrl,
  view
}) => {
  const hall = wallHallOn({ plan: hallPlanOf(snapshot), rows, view })

  const tableOf = (row: WallRow, wallTable: WallRow['tables'][number]) => (
    <WallTable
      encounterMatches={row.matches}
      key={wallTable.table}
      nowMs={nowMs}
      paintOf={(_, side) => (side === 'home' ? row.home : row.away)}
      players={snapshot.players}
      wallTable={wallTable}
    />
  )

  return (
    <div
      className='wall-board'
      data-hall={hall === null ? undefined : true}
      style={{
        '--columns': hall?.columns ?? 1,
        '--rows': hall?.rows ?? rows.length
      }}
    >
      {hall === null
        ? rows.map((row) => (
            <section className='wall-row' key={row.id}>
              <WallEncounter
                away={row.away}
                home={row.home}
                points={row.points}
              />
              {row.tables.map((wallTable) => tableOf(row, wallTable))}
            </section>
          ))
        : hall.frames.map(({ area, places, row }) => (
            <section
              className='wall-frame'
              key={row.id}
              style={areaStyle(area)}
            >
              <WallEncounter
                away={row.away}
                home={row.home}
                points={row.points}
              />
              <div className='wall-frame-tables'>
                {row.tables.map((wallTable) => (
                  <div
                    className='wall-frame-place'
                    key={wallTable.table}
                    style={{
                      '--place-column': places.get(wallTable.table)?.column,
                      '--place-row': places.get(wallTable.table)?.row
                    }}
                  >
                    {tableOf(row, wallTable)}
                  </div>
                ))}
              </div>
            </section>
          ))}
      <WallJoin
        eventId={eventId}
        spectatorUrl={spectatorUrl}
        style={hall === null ? undefined : areaStyle(hall.join)}
      />
    </div>
  )
}
