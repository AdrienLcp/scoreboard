import {
  DEFAULT_HALL_DEPTH_M,
  DEFAULT_HALL_WIDTH_M,
  type HallPlan,
  type HallTable,
  PLAY_AREA_LENGTH_M,
  PLAY_AREA_WIDTH_M
} from '@scoreboard/protocol/hall-plan'
import type { TableNumber } from '@scoreboard/protocol/identifiers'

/** A rectangle of the hall in metres, from its top left corner, the stands at the bottom. */
export type HallArea = { height: number; width: number; x: number; y: number }

/** Below this, two lengths in metres are the same. */
const EPSILON = 1e-6
/** Places are kept to the half metre. */
const STEP_M = 0.5
/** Two play areas this close still touch: they form one block. */
const TOUCHING_GAP_M = 0.6
/** A dragged table within this distance of another's edge or centre aligns on it. */
export const SNAP_DISTANCE_M = 0.7
/** A table dropped on another is slid to a free place no further than this, or it goes back. */
const MAX_SLIDE_M = 8
const WALL_MARGIN_M = 2

export const roundToStep = (metres: number): number =>
  Math.round(metres / STEP_M) * STEP_M

const clamp = (value: number, low: number, high: number): number =>
  Math.min(Math.max(value, low), Math.max(low, high))

export const areaOf = (table: Pick<HallTable, 'isTurned' | 'x' | 'y'>) =>
  table.isTurned
    ? {
        height: PLAY_AREA_LENGTH_M,
        width: PLAY_AREA_WIDTH_M,
        x: table.x,
        y: table.y
      }
    : {
        height: PLAY_AREA_WIDTH_M,
        width: PLAY_AREA_LENGTH_M,
        x: table.x,
        y: table.y
      }

const sharedLength = (
  start: number,
  end: number,
  otherStart: number,
  otherEnd: number
): number => Math.min(end, otherEnd) - Math.max(start, otherStart)

export const areasOverlap = (one: HallArea, other: HallArea): boolean =>
  sharedLength(one.x, one.x + one.width, other.x, other.x + other.width) >
    EPSILON &&
  sharedLength(one.y, one.y + one.height, other.y, other.y + other.height) >
    EPSILON

export const areaContains = (
  area: HallArea,
  point: { x: number; y: number }
): boolean =>
  point.x >= area.x &&
  point.x <= area.x + area.width &&
  point.y >= area.y &&
  point.y <= area.y + area.height

export const unionOf = (one: HallArea, other: HallArea): HallArea => {
  const x = Math.min(one.x, other.x)
  const y = Math.min(one.y, other.y)

  return {
    height: Math.max(one.y + one.height, other.y + other.height) - y,
    width: Math.max(one.x + one.width, other.x + other.width) - x,
    x,
    y
  }
}

/** Side by side or stacked, edge against edge along the whole of the shorter one. */
export const areAdjacent = (one: HallArea, other: HallArea): boolean => {
  const gapX = Math.max(
    other.x - (one.x + one.width),
    one.x - (other.x + other.width)
  )
  const gapY = Math.max(
    other.y - (one.y + one.height),
    one.y - (other.y + other.height)
  )
  const sharedX = sharedLength(
    one.x,
    one.x + one.width,
    other.x,
    other.x + other.width
  )
  const sharedY = sharedLength(
    one.y,
    one.y + one.height,
    other.y,
    other.y + other.height
  )

  return (
    (gapX > -EPSILON &&
      gapX <= TOUCHING_GAP_M &&
      sharedY >= Math.min(one.height, other.height) - EPSILON) ||
    (gapY > -EPSILON &&
      gapY <= TOUCHING_GAP_M &&
      sharedX >= Math.min(one.width, other.width) - EPSILON)
  )
}

/** The block a table belongs to: tables `2k − 1` and `2k` host one encounter. */
export const blockOf = (table: TableNumber): [TableNumber, TableNumber] => {
  const first = table % 2 === 0 ? table - 1 : table

  return [first, first + 1]
}

export const partnerOf = (table: TableNumber): TableNumber =>
  table % 2 === 0 ? table - 1 : table + 1

export const hallTableOf = (
  plan: HallPlan,
  table: TableNumber
): HallTable | undefined =>
  plan.tables.find((candidate) => candidate.table === table)

export const isHiddenIn = (plan: HallPlan, table: TableNumber): boolean =>
  hallTableOf(plan, table)?.isHidden === true

export const standingTablesOf = (
  plan: HallPlan,
  except: readonly TableNumber[] = []
): HallTable[] =>
  plan.tables.filter(
    (table) => !table.isHidden && !except.includes(table.table)
  )

const standingAreas = (
  plan: HallPlan,
  except: readonly TableNumber[] = []
): HallArea[] => standingTablesOf(plan, except).map(areaOf)

/** The tables put away for the day, by number. */
export const reservedTablesOf = (plan: HallPlan): HallTable[] =>
  plan.tables
    .filter((table) => table.isHidden)
    .sort((one, other) => one.table - other.table)

export type StandingPair = {
  area: HallArea
  /** Its two tables touch: they read, move and turn as one block. */
  isAdjacent: boolean
  tables: [TableNumber, TableNumber]
}

/** The blocks `2k − 1`, `2k` whose two tables stand today. */
export const standingPairsOf = (plan: HallPlan): StandingPair[] =>
  standingTablesOf(plan)
    .filter((table) => table.table % 2 === 1)
    .flatMap((first) => {
      const second = hallTableOf(plan, first.table + 1)

      if (second === undefined || second.isHidden) {
        return []
      }

      const one = areaOf(first)
      const other = areaOf(second)

      return [
        {
          area: unionOf(one, other),
          isAdjacent: areAdjacent(one, other),
          tables: [first.table, second.table] satisfies [
            TableNumber,
            TableNumber
          ]
        }
      ]
    })
    .sort((one, other) => one.tables[0] - other.tables[0])

/** The partner standing against this table: they turn as one block. */
const touchingPartner = (
  plan: HallPlan,
  table: TableNumber
): HallTable | undefined => {
  const here = hallTableOf(plan, table)
  const partner = hallTableOf(plan, partnerOf(table))

  return here !== undefined &&
    partner !== undefined &&
    !here.isHidden &&
    !partner.isHidden &&
    areAdjacent(areaOf(here), areaOf(partner))
    ? partner
    : undefined
}

export const isInTouchingBlock = (
  plan: HallPlan,
  table: TableNumber
): boolean => touchingPartner(plan, table) !== undefined

/**
 * The club's usual hall of eight tables (`implantation-8-tables`): a block of
 * two stacked on the left, an aisle, then six in three rows of two side by
 * side.
 */
const EIGHT_TABLE_HALL: readonly { x: number; y: number }[] = [
  { x: 2, y: 4.5 },
  { x: 2, y: 9.5 },
  { x: 15, y: 2 },
  { x: 25, y: 2 },
  { x: 15, y: 7 },
  { x: 25, y: 7 },
  { x: 15, y: 12 },
  { x: 25, y: 12 }
]

/** Any other count: blocks of two stacked tables, three blocks a row, an aisle between them. */
const BLOCKS_PER_ROW = 3
const BLOCK_AISLE_M = 1.5
const ROW_AISLE_M = 2

const genericPlaceOf = (index: number) => {
  const block = Math.floor(index / 2)
  const column = block % BLOCKS_PER_ROW
  const row = Math.floor(block / BLOCKS_PER_ROW)

  return {
    x: WALL_MARGIN_M + column * (PLAY_AREA_LENGTH_M + BLOCK_AISLE_M),
    y:
      WALL_MARGIN_M +
      row * (2 * PLAY_AREA_WIDTH_M + ROW_AISLE_M) +
      (index % 2) * PLAY_AREA_WIDTH_M
  }
}

const deepEnoughFor = (tables: readonly HallTable[], depth: number): number =>
  Math.max(
    depth,
    ...tables.map((table) => {
      const area = areaOf(table)

      return area.y + area.height + WALL_MARGIN_M
    })
  )

export const defaultHallPlan = (tableCount: number): HallPlan => {
  const tables = Array.from({ length: tableCount }, (_, index) => ({
    isHidden: false,
    isTurned: false,
    table: index + 1,
    ...(tableCount === EIGHT_TABLE_HALL.length
      ? (EIGHT_TABLE_HALL[index] ?? genericPlaceOf(index))
      : genericPlaceOf(index))
  }))

  return {
    depth: deepEnoughFor(tables, DEFAULT_HALL_DEPTH_M),
    tables,
    width: DEFAULT_HALL_WIDTH_M
  }
}

const fitsIn = (plan: HallPlan, area: HallArea, depth = plan.depth) =>
  area.x >= -EPSILON &&
  area.y >= -EPSILON &&
  area.x + area.width <= plan.width + EPSILON &&
  area.y + area.height <= depth + EPSILON

/**
 * Where the next table goes: against the last standing table that has room
 * below, right, left or above it, else under all of them, the hall growing
 * deeper when it must.
 */
export const freeSpotOf = (
  plan: HallPlan
): { area: HallArea; depth: number } => {
  const standing = standingTablesOf(plan)
  const taken = standing.map(areaOf)
  const isFree = (area: HallArea) =>
    fitsIn(plan, area) && !taken.some((other) => areasOverlap(area, other))
  const byNumberDown = [...standing].sort(
    (one, other) => other.table - one.table
  )

  for (const table of byNumberDown) {
    const area = areaOf(table)
    const around = [
      { x: area.x, y: area.y + area.height },
      { x: area.x + area.width, y: area.y },
      { x: area.x - PLAY_AREA_LENGTH_M, y: area.y },
      { x: area.x, y: area.y - PLAY_AREA_WIDTH_M }
    ].map((place) => ({
      ...place,
      height: PLAY_AREA_WIDTH_M,
      width: PLAY_AREA_LENGTH_M
    }))
    const spot = around.find(isFree)

    if (spot !== undefined) {
      return { area: spot, depth: plan.depth }
    }
  }

  const bottom = Math.max(0, ...taken.map((area) => area.y + area.height))
  const left = Math.min(plan.width, ...taken.map((area) => area.x))
  const area = {
    height: PLAY_AREA_WIDTH_M,
    width: PLAY_AREA_LENGTH_M,
    x: taken.length === 0 ? WALL_MARGIN_M : left,
    y: taken.length === 0 ? WALL_MARGIN_M : bottom + STEP_M
  }

  return {
    area,
    depth: Math.max(plan.depth, area.y + area.height + WALL_MARGIN_M)
  }
}

/**
 * The event's plan with exactly its tables: the saved one, or the default
 * for its count; tables gone with a smaller count leave, new ones take the
 * next free spot.
 */
export const hallPlanOf = ({
  hall,
  tableCount
}: {
  hall: HallPlan | null
  tableCount: number
}): HallPlan => {
  if (hall === null) {
    return defaultHallPlan(tableCount)
  }

  let plan: HallPlan = {
    ...hall,
    tables: hall.tables
      .filter((table) => table.table <= tableCount)
      .sort((one, other) => one.table - other.table)
  }

  for (let table = 1; table <= tableCount; table++) {
    if (hallTableOf(plan, table) === undefined) {
      plan = withTableAtFreeSpot(plan, table)
    }
  }

  return plan
}

const withTableAtFreeSpot = (plan: HallPlan, table: TableNumber): HallPlan => {
  const { area, depth } = freeSpotOf(plan)

  return {
    ...plan,
    depth,
    tables: [
      ...plan.tables.filter((candidate) => candidate.table !== table),
      { isHidden: false, isTurned: false, table, x: area.x, y: area.y }
    ].sort((one, other) => one.table - other.table)
  }
}

export type SnappedArea = {
  /** The vertical line it aligned on, to draw while dragging. */
  guideX: number | null
  guideY: number | null
  x: number
  y: number
}

/**
 * Magnetism: an edge or the centre of the dragged area within
 * `SNAP_DISTANCE_M` of a wall, or of another table's edge or centre, aligns
 * on it; otherwise it falls on the half metre. Kept inside the hall.
 */
export const snapArea = ({
  area,
  others,
  plan
}: {
  area: HallArea
  others: readonly HallArea[]
  plan: HallPlan
}): SnappedArea => {
  const snapAlong = (
    position: number,
    size: number,
    lines: readonly number[],
    limit: number
  ) => {
    let shift = Number.POSITIVE_INFINITY
    let line: number | null = null

    for (const mine of [position, position + size, position + size / 2]) {
      for (const candidate of lines) {
        if (Math.abs(candidate - mine) < Math.abs(shift)) {
          shift = candidate - mine
          line = candidate
        }
      }
    }

    const isSnapped = Math.abs(shift) <= SNAP_DISTANCE_M

    return {
      guide:
        isSnapped && line !== null && line > EPSILON && line < limit - EPSILON
          ? line
          : null,
      position: clamp(
        isSnapped ? position + shift : roundToStep(position),
        0,
        limit - size
      )
    }
  }
  const across = snapAlong(
    area.x,
    area.width,
    [
      0,
      plan.width,
      ...others.flatMap((o) => [o.x, o.x + o.width, o.x + o.width / 2])
    ],
    plan.width
  )
  const down = snapAlong(
    area.y,
    area.height,
    [
      0,
      plan.depth,
      ...others.flatMap((o) => [o.y, o.y + o.height, o.y + o.height / 2])
    ],
    plan.depth
  )

  return {
    guideX: across.guide,
    guideY: down.guide,
    x: across.position,
    y: down.position
  }
}

/**
 * Where an area dropped over another table settles: where it is when free,
 * else the nearest free place against one of the others, within
 * `MAX_SLIDE_M`; `null` when there is none, and the table goes back.
 */
export const settleArea = ({
  area,
  others,
  plan
}: {
  area: HallArea
  others: readonly HallArea[]
  plan: HallPlan
}): HallArea | null => {
  const isFree = (candidate: HallArea) =>
    fitsIn(plan, candidate) &&
    !others.some((other) => areasOverlap(candidate, other))

  if (isFree(area)) {
    return area
  }

  const distance = (candidate: HallArea) =>
    Math.hypot(candidate.x - area.x, candidate.y - area.y)
  const nearest = others
    .flatMap((other) => [
      { x: other.x - area.width, y: area.y },
      { x: other.x + other.width, y: area.y },
      { x: area.x, y: other.y - area.height },
      { x: area.x, y: other.y + other.height },
      { x: other.x - area.width, y: other.y },
      { x: other.x + other.width, y: other.y },
      { x: other.x, y: other.y - area.height },
      { x: other.x, y: other.y + other.height }
    ])
    .map((place) => ({ ...area, ...place }))
    .filter(isFree)
    .sort((one, other) => distance(one) - distance(other))[0]

  return nearest !== undefined && distance(nearest) < MAX_SLIDE_M
    ? nearest
    : null
}

const withPlaces = (
  plan: HallPlan,
  places: ReadonlyMap<TableNumber, Partial<HallTable>>
): HallPlan => ({
  ...plan,
  tables: plan.tables.map((table) => {
    const place = places.get(table.table)

    return place === undefined ? table : { ...table, ...place }
  })
})

/**
 * Moves tables together by a shift in metres, as dragged: settled clear of
 * the others, or `null` when no free place is near enough.
 */
export const moveHallTables = ({
  plan,
  shiftX,
  shiftY,
  tables
}: {
  plan: HallPlan
  shiftX: number
  shiftY: number
  tables: readonly TableNumber[]
}): HallPlan | null => {
  const moved = tables.flatMap((table) => hallTableOf(plan, table) ?? [])

  if (moved.length === 0) {
    return null
  }

  const group = moved.map(areaOf).reduce(unionOf)
  const settled = settleArea({
    area: { ...group, x: group.x + shiftX, y: group.y + shiftY },
    others: standingAreas(plan, tables),
    plan
  })

  if (settled === null) {
    return null
  }

  return withPlaces(
    plan,
    new Map(
      moved.map((table) => [
        table.table,
        {
          x: roundToStep(table.x + settled.x - group.x),
          y: roundToStep(table.y + settled.y - group.y)
        }
      ])
    )
  )
}

/** Two tables trade places, each with its turn. */
export const swapHallTables = (
  plan: HallPlan,
  one: TableNumber,
  other: TableNumber
): HallPlan => {
  const first = hallTableOf(plan, one)
  const second = hallTableOf(plan, other)

  if (first === undefined || second === undefined) {
    return plan
  }

  const placeOf = ({ isTurned, x, y }: HallTable) => ({ isTurned, x, y })

  return withPlaces(
    plan,
    new Map([
      [one, placeOf(second)],
      [other, placeOf(first)]
    ])
  )
}

/** Two blocks trade places, the odd table of one where the odd table of the other stood. */
export const swapHallBlocks = (
  plan: HallPlan,
  one: TableNumber,
  other: TableNumber
): HallPlan => {
  const [oneFirst, oneSecond] = blockOf(one)
  const [otherFirst, otherSecond] = blockOf(other)

  return swapHallTables(
    swapHallTables(plan, oneFirst, otherFirst),
    oneSecond,
    otherSecond
  )
}

const turnAlone = (plan: HallPlan, table: HallTable): HallPlan | null => {
  const area = areaOf(table)
  const turned = { height: area.width, width: area.height }
  const settled = settleArea({
    area: {
      ...turned,
      x: clamp(
        area.x + area.width / 2 - turned.width / 2,
        0,
        plan.width - turned.width
      ),
      y: clamp(
        area.y + area.height / 2 - turned.height / 2,
        0,
        plan.depth - turned.height
      )
    },
    others: standingAreas(plan, [table.table]),
    plan
  })

  return settled === null
    ? null
    : withPlaces(
        plan,
        new Map([
          [
            table.table,
            {
              isTurned: !table.isTurned,
              x: roundToStep(settled.x),
              y: roundToStep(settled.y)
            }
          ]
        ])
      )
}

/**
 * A quarter turn of a block about its centre: side by side becomes stacked
 * and back, each table turns, the odd one stays top or left, so the four
 * arrangements stay reachable and the pair never breaks.
 */
const turnBlock = (
  plan: HallPlan,
  first: HallTable,
  second: HallTable
): HallPlan | null => {
  const one = areaOf(first)
  const other = areaOf(second)
  const gapX = Math.max(
    other.x - (one.x + one.width),
    one.x - (other.x + other.width)
  )
  const gapY = Math.max(
    other.y - (one.y + one.height),
    one.y - (other.y + other.height)
  )
  const wasSideBySide = gapX > -EPSILON
  const gap = Math.max(0, wasSideBySide ? gapX : gapY)
  const turnedOne = { height: one.width, width: one.height }
  const turnedOther = { height: other.width, width: other.height }
  const width = wasSideBySide
    ? Math.max(turnedOne.width, turnedOther.width)
    : turnedOne.width + gap + turnedOther.width
  const height = wasSideBySide
    ? turnedOne.height + gap + turnedOther.height
    : Math.max(turnedOne.height, turnedOther.height)
  const box = unionOf(one, other)
  const settled = settleArea({
    area: {
      height,
      width,
      x: clamp(
        roundToStep(box.x + box.width / 2 - width / 2),
        0,
        plan.width - width
      ),
      y: clamp(
        roundToStep(box.y + box.height / 2 - height / 2),
        0,
        plan.depth - height
      )
    },
    others: standingAreas(plan, [first.table, second.table]),
    plan
  })

  if (settled === null) {
    return null
  }

  const [firstPlace, secondPlace] = wasSideBySide
    ? [
        { x: settled.x + (width - turnedOne.width) / 2, y: settled.y },
        {
          x: settled.x + (width - turnedOther.width) / 2,
          y: settled.y + turnedOne.height + gap
        }
      ]
    : [
        { x: settled.x, y: settled.y + (height - turnedOne.height) / 2 },
        {
          x: settled.x + turnedOne.width + gap,
          y: settled.y + (height - turnedOther.height) / 2
        }
      ]

  return withPlaces(
    plan,
    new Map([
      [
        first.table,
        {
          isTurned: !first.isTurned,
          x: roundToStep(firstPlace.x),
          y: roundToStep(firstPlace.y)
        }
      ],
      [
        second.table,
        {
          isTurned: !second.isTurned,
          x: roundToStep(secondPlace.x),
          y: roundToStep(secondPlace.y)
        }
      ]
    ])
  )
}

/**
 * A quarter turn: a table standing against its partner turns with its whole
 * block, a lone table alone. `null` when there is no room to turn here.
 */
export const turnHallTable = (
  plan: HallPlan,
  table: TableNumber
): HallPlan | null => {
  const here = hallTableOf(plan, table)

  if (here === undefined || here.isHidden) {
    return null
  }

  const partner = touchingPartner(plan, table)

  if (partner === undefined) {
    return turnAlone(plan, here)
  }

  return here.table < partner.table
    ? turnBlock(plan, here, partner)
    : turnBlock(plan, partner, here)
}

/** Put away for the day: the tables leave the drawing for the reserve, their numbers kept. */
export const putAwayHallTables = (
  plan: HallPlan,
  tables: readonly TableNumber[]
): HallPlan =>
  withPlaces(plan, new Map(tables.map((table) => [table, { isHidden: true }])))

/**
 * Back from the reserve: where it is dropped, or to its last place, or the
 * nearest free one when another table took it, else the next free spot.
 * `null` when it is dropped where there is no room.
 */
export const putBackHallTable = ({
  at,
  plan,
  table
}: {
  at?: { x: number; y: number }
  plan: HallPlan
  table: TableNumber
}): HallPlan | null => {
  const here = hallTableOf(plan, table)

  if (here === undefined) {
    return null
  }

  const area = areaOf({ ...here, ...at })
  const settled = settleArea({
    area: {
      ...area,
      x: clamp(area.x, 0, plan.width - area.width),
      y: clamp(area.y, 0, plan.depth - area.height)
    },
    others: standingAreas(plan, [table]),
    plan
  })

  if (settled !== null) {
    return withPlaces(
      plan,
      new Map([
        [
          table,
          {
            isHidden: false,
            x: roundToStep(settled.x),
            y: roundToStep(settled.y)
          }
        ]
      ])
    )
  }

  if (at !== undefined) {
    return null
  }

  const { area: spot, depth } = freeSpotOf(plan)

  return {
    ...withPlaces(
      plan,
      new Map([
        [table, { isHidden: false, isTurned: false, x: spot.x, y: spot.y }]
      ])
    ),
    depth
  }
}

/** One more table, numbered after the last, at the next free spot. */
export const addHallTable = (plan: HallPlan): HallPlan =>
  withTableAtFreeSpot(
    plan,
    plan.tables.reduce((last, table) => Math.max(last, table.table), 0) + 1
  )

/**
 * A table gone for good: the others are numbered 1 to N again, whole blocks
 * first in their order so each pair and its encounter stay together, a table
 * left without its partner taking the last numbers. A table put away keeps
 * its number; only a deletion renumbers.
 */
export const deleteHallTable = (
  plan: HallPlan,
  table: TableNumber
): { numbers: ReadonlyMap<TableNumber, TableNumber>; plan: HallPlan } => {
  const rest = plan.tables.filter((candidate) => candidate.table !== table)
  const kept = new Set(rest.map((candidate) => candidate.table))
  const firsts = [
    ...new Set(rest.map((candidate) => blockOf(candidate.table)[0]))
  ].sort((one, other) => one - other)
  const pairs = firsts.filter((first) => kept.has(first) && kept.has(first + 1))
  const singles = firsts
    .filter((first) => !pairs.includes(first))
    .map((first) => (kept.has(first) ? first : first + 1))
  const order = [...pairs.flatMap((first) => [first, first + 1]), ...singles]
  const numbers = new Map(order.map((from, index) => [from, index + 1]))

  return {
    numbers,
    plan: {
      ...plan,
      tables: rest
        .map((candidate) => ({
          ...candidate,
          table: numbers.get(candidate.table) ?? candidate.table
        }))
        .sort((one, other) => one.table - other.table)
    }
  }
}

/** Rows and columns of tables, for a screen that draws the hall as a grid. */
export type HallGrid = {
  columns: number
  /** Each standing table's cell, counted from 0 at the top left. */
  places: ReadonlyMap<TableNumber, { column: number; row: number }>
  rows: number
}

type Band = { end: number; start: number; tables: TableNumber[] }

const extentOf = (span: { end: number; start: number }): number =>
  span.end - span.start

/**
 * Tables sharing at least half of the smaller one's extent along an axis read
 * as one row or column. The shorter spans found the bands, so a turned table
 * beside two stacked ones joins one of their rows instead of merging them.
 */
const bandsOf = (
  spans: readonly { end: number; start: number; table: TableNumber }[]
): Band[] => {
  const bands: Band[] = []

  for (const span of [...spans].sort(
    (one, other) =>
      extentOf(one) - extentOf(other) ||
      one.start - other.start ||
      one.table - other.table
  )) {
    const band = bands.find(
      (candidate) =>
        sharedLength(candidate.start, candidate.end, span.start, span.end) >=
        0.5 * Math.min(extentOf(candidate), extentOf(span)) - EPSILON
    )

    if (band === undefined) {
      bands.push({ end: span.end, start: span.start, tables: [span.table] })
    } else {
      band.tables.push(span.table)
    }
  }

  return bands.sort((one, other) => one.start - other.start)
}

/**
 * The standing tables read as a grid of rows and columns, for the wall and
 * the spectators' plan; `null` when two tables would share a cell.
 */
export const hallGridOf = (plan: HallPlan): HallGrid | null => {
  const standing = standingTablesOf(plan).map((table) => ({
    area: areaOf(table),
    table: table.table
  }))
  const columns = bandsOf(
    standing.map(({ area, table }) => ({
      end: area.x + area.width,
      start: area.x,
      table
    }))
  )
  const rows = bandsOf(
    standing.map(({ area, table }) => ({
      end: area.y + area.height,
      start: area.y,
      table
    }))
  )
  const places = new Map<TableNumber, { column: number; row: number }>()

  for (const [column, band] of columns.entries()) {
    for (const table of band.tables) {
      places.set(table, {
        column,
        row: rows.findIndex((row) => row.tables.includes(table))
      })
    }
  }

  const cells = new Set(
    [...places.values()].map(({ column, row }) => `${column},${row}`)
  )

  return cells.size === places.size
    ? { columns: columns.length, places, rows: rows.length }
    : null
}
