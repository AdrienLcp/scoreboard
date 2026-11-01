import type React from 'react'

import type { WallView } from '@scoreboard/protocol/wall-view'

import type {
  ScreenSketch,
  SketchFrame,
  SketchGroup,
  SketchHall
} from './screen-sketch'

import './wall-view-thumbnail.sass'

const WIDTH = 160
const HEIGHT = 90
const HEAD = 11
const BAND = 2.5
const GAP = 2
const EDGE = 4
const BODY_TOP = HEAD + BAND + GAP
const BODY_HEIGHT = HEIGHT - BODY_TOP - GAP
const JOIN_WIDTH = 30
const TEAM_WIDTH = 24
const TEAM_BAR = 5
/** The drawn table's share of its place. */
const TABLE_SHARE = 0.7

type Box = { height: number; width: number; x: number; y: number }

/** Both teams of a group: the home team's colour over the visitors' white. */
const Teams: React.FC<{ box: Box; colour: string; isAcross: boolean }> = ({
  box,
  colour,
  isAcross
}) => {
  const home = isAcross
    ? { ...box, width: box.width / 2 }
    : { ...box, height: box.height / 2 }
  const away = isAcross
    ? { ...home, x: box.x + home.width }
    : { ...home, y: box.y + home.height }

  return (
    <>
      <rect className='wall-thumbnail-team' fill={colour} {...home} />
      <rect className='wall-thumbnail-team wall-thumbnail-away' {...away} />
    </>
  )
}

const Join: React.FC<{ box: Box }> = ({ box }) => {
  const side = Math.max(0, Math.min(14, box.width - 6, box.height - 6))

  return (
    <>
      <rect className='wall-thumbnail-join' {...box} />
      <rect
        className='wall-thumbnail-qr'
        height={side}
        width={side}
        x={box.x + 3}
        y={box.y + 3}
      />
    </>
  )
}

const RowsSketch: React.FC<{ groups: readonly SketchGroup[] }> = ({
  groups
}) => {
  const rowWidth = WIDTH - 2 * EDGE - GAP - JOIN_WIDTH
  const height =
    (BODY_HEIGHT - GAP * Math.max(groups.length - 1, 0)) /
    Math.max(groups.length, 1)

  return (
    <>
      {groups.map((group, index) => {
        const y = BODY_TOP + index * (height + GAP)
        const tablesX = group.colour === null ? EDGE + 4 : EDGE + TEAM_WIDTH + 6
        const tablesWidth = EDGE + rowWidth - 2 - tablesX
        const tableWidth =
          (tablesWidth - 4 * (group.tables.length - 1)) /
          Math.max(group.tables.length, 1)

        return (
          <g key={group.id}>
            <rect
              className='wall-thumbnail-frame'
              height={height}
              width={rowWidth}
              x={EDGE}
              y={y}
            />
            {group.colour === null ? null : (
              <Teams
                box={{
                  height: height - 3,
                  width: TEAM_WIDTH,
                  x: EDGE + 2,
                  y: y + 1.5
                }}
                colour={group.colour}
                isAcross={false}
              />
            )}
            {group.tables.map((table, position) => (
              <rect
                className='wall-thumbnail-table'
                height={height * 0.55}
                key={table}
                width={tableWidth}
                x={tablesX + position * (tableWidth + 4)}
                y={y + height * 0.3}
              />
            ))}
          </g>
        )
      })}
      <Join
        box={{
          height: BODY_HEIGHT,
          width: JOIN_WIDTH,
          x: WIDTH - EDGE - JOIN_WIDTH,
          y: BODY_TOP
        }}
      />
    </>
  )
}

const FrameSketch: React.FC<{ box: Box; frame: SketchFrame }> = ({
  box,
  frame
}) => {
  const top = frame.colour === null ? 1 : TEAM_BAR + 3
  const cellWidth = (box.width - 4) / frame.area.columnSpan
  const cellHeight = (box.height - top - 1) / frame.area.rowSpan

  return (
    <g>
      <rect className='wall-thumbnail-frame' {...box} />
      {frame.colour === null ? null : (
        <Teams
          box={{
            height: TEAM_BAR,
            width: box.width - 3,
            x: box.x + 1.5,
            y: box.y + 1.5
          }}
          colour={frame.colour}
          isAcross
        />
      )}
      {frame.places.map((place) => (
        <rect
          className='wall-thumbnail-table'
          height={cellHeight * 0.5}
          key={`${place.column}-${place.row}`}
          width={cellWidth * TABLE_SHARE}
          x={
            box.x +
            2 +
            (place.column - 1) * cellWidth +
            (cellWidth * (1 - TABLE_SHARE)) / 2
          }
          y={box.y + top + (place.row - 1) * cellHeight + cellHeight * 0.25}
        />
      ))}
    </g>
  )
}

const HallSketch: React.FC<{ hall: SketchHall }> = ({ hall }) => {
  const columns = hall.columns + (hall.join === null ? 1 : 0)
  const cellWidth = (WIDTH - 2 * EDGE - GAP * (columns - 1)) / columns
  const cellHeight = (BODY_HEIGHT - GAP * (hall.rows - 1)) / hall.rows
  const boxOf = ({
    column,
    columnSpan,
    row,
    rowSpan
  }: SketchFrame['area']): Box => ({
    height: rowSpan * cellHeight + (rowSpan - 1) * GAP,
    width: columnSpan * cellWidth + (columnSpan - 1) * GAP,
    x: EDGE + (column - 1) * (cellWidth + GAP),
    y: BODY_TOP + (row - 1) * (cellHeight + GAP)
  })

  return (
    <>
      {hall.frames.map((frame) => (
        <FrameSketch box={boxOf(frame.area)} frame={frame} key={frame.id} />
      ))}
      <Join
        box={boxOf(
          hall.join ?? {
            column: columns,
            columnSpan: 1,
            row: 1,
            rowSpan: hall.rows
          }
        )}
      />
    </>
  )
}

/**
 * A screen's wall in small, one way or the other: its head and band, then
 * its encounters in rows or where they stand, and the spectators' QR.
 */
export const WallViewThumbnail: React.FC<{
  sketch: ScreenSketch
  view: WallView
}> = ({ sketch, view }) => (
  <svg
    aria-hidden='true'
    className='wall-thumbnail'
    focusable='false'
    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
  >
    <rect className='wall-thumbnail-ground' height={HEIGHT} width={WIDTH} />
    <rect
      className='wall-thumbnail-mark'
      height={5}
      width={34}
      x={EDGE}
      y={3}
    />
    <rect
      className='wall-thumbnail-band'
      height={BAND}
      width={WIDTH}
      y={HEAD}
    />
    {view === 'encounters' ? (
      <RowsSketch groups={sketch.groups} />
    ) : sketch.hall === null ? null : (
      <HallSketch hall={sketch.hall} />
    )}
  </svg>
)
