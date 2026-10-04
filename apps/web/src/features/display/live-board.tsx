import type React from 'react'

import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type { TableNumber } from '@scoreboard/protocol/identifiers'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'

import type { EncounterLine } from '@/features/event/encounter-lines'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import {
  bestGridFor,
  LEGIBLE_UNIT_SHARE,
  pagesOf,
  tilesPerPage
} from './display-fit'
import type { PageIndicator } from './display-header'
import { stageTilesFor } from './display-stage'
import { displaySummaryFor } from './display-summary'
import { LiveTile } from './live-tile'
import { SummaryColumn } from './summary-column'
import { useGridArea } from './use-grid-area'
import { usePaging } from './use-paging'
import { useTileReflow } from './use-tile-reflow'

import './live-board.sass'

type LiveBoardProps = {
  encounters: readonly EncounterLine[]
  encounterTitleFor: (match: MatchView) => string | null
  nowMs: InstantMs
  /** Told which page of tiles is up, for the header's indicator. */
  renderHeader: (page: PageIndicator | null) => React.ReactNode
  snapshot: PublicSnapshot
  spectatorUrl: string
  tables: readonly TableNumber[]
}

/** Live tiles fitted to the screen, paged only when they would stop being legible. */
export const LiveBoard: React.FC<LiveBoardProps> = ({
  encounters,
  encounterTitleFor,
  nowMs,
  renderHeader,
  snapshot,
  spectatorUrl,
  tables
}) => {
  const translate = useTranslate()
  const { gridRef, measured } = useGridArea()
  const tiles = stageTilesFor({ nowMs, snapshot, tables })
  const { area } = measured
  const perPage =
    area === null || measured.isStacked
      ? Math.max(1, tiles.length)
      : tilesPerPage({
          area,
          count: tiles.length,
          minimumUnit: measured.viewportHeight * LEGIBLE_UNIT_SHARE
        })
  const pages = pagesOf(tiles, perPage)
  const pageIndex = usePaging(pages.length)
  const shown = pages[pageIndex] ?? []
  const fit = area === null ? null : bestGridFor({ area, count: shown.length })
  const layoutKey = `${pageIndex}:${shown.map((tile) => tile.table).join(',')}`

  useTileReflow(gridRef, layoutKey)

  const firstShown = shown[0]
  const lastShown = shown.at(-1)
  const page =
    firstShown === undefined || lastShown === undefined
      ? null
      : {
          count: pages.length,
          firstTable: firstShown.table,
          index: pageIndex,
          lastTable: lastShown.table
        }

  return (
    <>
      {renderHeader(page)}
      <div className='live-board'>
        <section
          aria-label={translate('display.live')}
          className='live-grid'
          ref={gridRef}
          style={
            fit === null || measured.isStacked
              ? undefined
              : {
                  '--columns': fit.columns,
                  '--row-height': `${fit.rowHeight}px`,
                  '--rows': fit.rows
                }
          }
        >
          {shown.length === 0 ? (
            <p className='live-none'>{translate('display.noLive')}</p>
          ) : (
            shown.map((tile) => (
              <LiveTile
                encounterTitle={encounterTitleFor(tile.match)}
                isOver={tile.isOver}
                key={tile.table}
                match={tile.match}
                nowMs={nowMs}
                players={snapshot.players}
              />
            ))
          )}
        </section>
        <SummaryColumn
          encounters={encounters}
          encounterTitleFor={encounterTitleFor}
          nowMs={nowMs}
          players={snapshot.players}
          spectatorUrl={spectatorUrl}
          summary={displaySummaryFor({
            nowMs,
            onStage: tiles.map((tile) => tile.table),
            snapshot,
            tables
          })}
        />
      </div>
    </>
  )
}
