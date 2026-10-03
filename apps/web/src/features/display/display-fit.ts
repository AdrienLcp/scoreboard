/**
 * A tile is drawn on a unit worth `min(height, width × TILE_ASPECT)`: wider
 * than that, it only adds empty space beside the score.
 */
export const TILE_ASPECT = 0.75

/** Past this height, a tile's extra room would only spread its rows apart. */
const TILE_HEIGHT_CAP = TILE_ASPECT * 1.3

/** Below this share of the screen's height, a tile's figures stop carrying across the hall. */
export const LEGIBLE_UNIT_SHARE = 0.23

export type GridArea = {
  gap: number
  height: number
  width: number
}

export type GridFit = {
  columns: number
  rowHeight: number
  rows: number
  /** The tile's drawing unit, in pixels: what decides legibility. */
  unit: number
}

/** The grid that draws `count` tiles largest in the area, trying every column count. */
export const bestGridFor = ({
  area,
  count
}: {
  area: GridArea
  count: number
}): GridFit => {
  const tiles = Math.max(1, count)
  let best: GridFit | null = null

  for (let columns = 1; columns <= tiles; columns += 1) {
    const rows = Math.ceil(tiles / columns)
    const width = (area.width - (columns - 1) * area.gap) / columns
    const height = (area.height - (rows - 1) * area.gap) / rows
    const unit = Math.min(height, width * TILE_ASPECT)

    if (best === null || unit > best.unit + 0.5) {
      best = {
        columns,
        rowHeight: Math.floor(Math.min(height, width * TILE_HEIGHT_CAP)),
        rows,
        unit
      }
    }
  }

  return (
    best ?? { columns: 1, rowHeight: area.height, rows: 1, unit: area.height }
  )
}

/**
 * How many tiles one page holds: all of them while they stay legible, else
 * fewer, spread evenly so the last page is not a lone tile.
 */
export const tilesPerPage = ({
  area,
  count,
  minimumUnit
}: {
  area: GridArea
  count: number
  minimumUnit: number
}): number => {
  if (count < 2) {
    return Math.max(1, count)
  }

  let perPage = count

  while (
    perPage > 1 &&
    bestGridFor({ area, count: perPage }).unit < minimumUnit
  ) {
    perPage -= 1
  }

  return Math.ceil(count / Math.ceil(count / perPage))
}

export const pagesOf = <T>(items: readonly T[], perPage: number): T[][] => {
  const pages: T[][] = []

  for (let start = 0; start < items.length; start += perPage) {
    pages.push(items.slice(start, start + perPage))
  }

  return pages
}
