import type { HallPlan } from '@scoreboard/protocol/hall-plan'
import type { TableNumber } from '@scoreboard/protocol/identifiers'

import type { HallPlace } from '@scoreboard/core/hall/hall-plan'

import type { WallRow } from './wall-rows'

/** A grid area of the wall, its first track counted from 1 as CSS does. */
export type WallArea = {
  column: number
  columnSpan: number
  row: number
  rowSpan: number
}

/** One encounter where its tables stand: its area, and each table's place inside it. */
export type WallFrame = {
  area: WallArea
  /** Where each table of the encounter stands inside its frame, counted from 1. */
  places: ReadonlyMap<TableNumber, HallPlace>
  row: WallRow
}

/** The wall laid out as the hall: one frame per encounter, the spectators' QR in a free place. */
export type WallHall = {
  columns: number
  frames: WallFrame[]
  join: WallArea
  rows: number
}

type Box = { first: HallPlace; last: HallPlace }

const boxOf = (places: readonly HallPlace[]): Box => ({
  first: {
    column: Math.min(...places.map((place) => place.column)),
    row: Math.min(...places.map((place) => place.row))
  },
  last: {
    column: Math.max(...places.map((place) => place.column)),
    row: Math.max(...places.map((place) => place.row))
  }
})

const areaOf = (box: Box): number =>
  (box.last.column - box.first.column + 1) * (box.last.row - box.first.row + 1)

const isInside = (place: HallPlace, box: Box): boolean =>
  place.column >= box.first.column &&
  place.column <= box.last.column &&
  place.row >= box.first.row &&
  place.row <= box.last.row

/** The plan's columns or rows some frame covers, so an empty aisle takes no room on the wall. */
const usedTracks = (boxes: readonly Box[], axis: keyof HallPlace): number[] =>
  [
    ...new Set(
      boxes.flatMap((box) =>
        Array.from(
          { length: box.last[axis] - box.first[axis] + 1 },
          (_, index) => box.first[axis] + index
        )
      )
    )
  ].sort((one, other) => one - other)

/**
 * The wall as the hall: every encounter in one frame where its tables stand,
 * empty aisles closed up, and the spectators' QR in the free place nearest
 * the stands on the left. `null` when the plan cannot hold it — an encounter
 * split across the hall, two frames overlapping, or no free place.
 */
export const wallHallFor = ({
  plan,
  rows
}: {
  plan: HallPlan
  rows: readonly WallRow[]
}): WallHall | null => {
  const placed = rows.map((row) =>
    row.tables.map(
      ({ table }) =>
        plan.tables.find((candidate) => candidate.table === table) ?? null
    )
  )
  const boxes = placed.flatMap((places) =>
    places.every((place) => place !== null) && places.length > 0
      ? [boxOf(places)]
      : []
  )
  const isHeld =
    boxes.length === rows.length &&
    boxes.every((box, index) => areaOf(box) === placed[index]?.length) &&
    placed
      .flat()
      .every(
        (place) =>
          place !== null &&
          boxes.filter((box) => isInside(place, box)).length === 1
      )

  if (!isHeld) {
    return null
  }

  const columns = usedTracks(boxes, 'column')
  const lines = usedTracks(boxes, 'row')
  const wallPlaceOf = (place: HallPlace): HallPlace => ({
    column: columns.indexOf(place.column) + 1,
    row: lines.indexOf(place.row) + 1
  })
  const framed = boxes.map((box) => ({
    first: wallPlaceOf(box.first),
    last: wallPlaceOf(box.last)
  }))
  const freePlaces = lines
    .map((_, index) => lines.length - index)
    .flatMap((row) => columns.map((_, index) => ({ column: index + 1, row })))
    .filter((place) => !framed.some((box) => isInside(place, box)))
  const join = freePlaces[0]

  if (join === undefined) {
    return null
  }

  return {
    columns: columns.length,
    frames: rows.map((row, index) => {
      const box = framed[index] ?? { first: join, last: join }

      return {
        area: {
          column: box.first.column,
          columnSpan: box.last.column - box.first.column + 1,
          row: box.first.row,
          rowSpan: box.last.row - box.first.row + 1
        },
        places: new Map(
          row.tables.map(({ table }, tableIndex) => {
            const place = wallPlaceOf(placed[index]?.[tableIndex] ?? box.first)

            return [
              table,
              {
                column: place.column - box.first.column + 1,
                row: place.row - box.first.row + 1
              }
            ]
          })
        ),
        row
      }
    }),
    join: { ...join, columnSpan: 1, rowSpan: 1 },
    rows: lines.length
  }
}
