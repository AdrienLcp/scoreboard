import {
  HALL_GRID_SIZE,
  type HallPlan,
  type HallTable
} from '@scoreboard/protocol/hall-plan'
import type { TableNumber } from '@scoreboard/protocol/identifiers'

/** A place of the plan's grid, counted from the top left, the stands at the bottom. */
export type HallPlace = { column: number; row: number }

/**
 * The club's usual hall of eight tables (`implantation-8-tables`): a block of
 * two stacked on the left, a gap of about two metres, then six in two columns
 * of three. Each pair of the right block stands side by side.
 */
const EIGHT_TABLE_HALL: readonly HallPlace[] = [
  { column: 0, row: 0 },
  { column: 0, row: 1 },
  { column: 2, row: 0 },
  { column: 3, row: 0 },
  { column: 2, row: 1 },
  { column: 3, row: 1 },
  { column: 2, row: 2 },
  { column: 3, row: 2 }
]

/** Two blocks of two side by side per row; a big hall gets four. */
const columnsFor = (tableCount: number): number => (tableCount > 16 ? 8 : 4)

const placeOf = (index: number, tableCount: number): HallPlace =>
  tableCount === EIGHT_TABLE_HALL.length
    ? (EIGHT_TABLE_HALL[index] ?? { column: 0, row: 0 })
    : {
        column: index % columnsFor(tableCount),
        row: Math.floor(index / columnsFor(tableCount))
      }

const tableNumbers = (tableCount: number): TableNumber[] =>
  Array.from({ length: tableCount }, (_, index) => index + 1)

export const defaultHallPlan = (tableCount: number): HallPlan => ({
  tables: tableNumbers(tableCount).map((table, index) => ({
    ...placeOf(index, tableCount),
    isHidden: false,
    table
  }))
})

const isSamePlace = (one: HallPlace, other: HallPlace): boolean =>
  one.column === other.column && one.row === other.row

const firstFreePlace = (taken: readonly HallPlace[]): HallPlace | null => {
  for (let row = 0; row < HALL_GRID_SIZE; row++) {
    for (let column = 0; column < HALL_GRID_SIZE; column++) {
      if (!taken.some((place) => isSamePlace(place, { column, row }))) {
        return { column, row }
      }
    }
  }

  return null
}

/**
 * The event's plan with exactly its tables: the saved one, or the default
 * for its count; tables gone with a smaller count leave, new ones take the
 * first free places.
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

  const kept = hall.tables.filter((table) => table.table <= tableCount)
  const placed: HallTable[] = []

  for (const table of tableNumbers(tableCount)) {
    const saved = kept.find((candidate) => candidate.table === table)
    const place = saved ?? firstFreePlace([...kept, ...placed])

    if (place !== null) {
      placed.push({
        column: place.column,
        isHidden: saved?.isHidden ?? false,
        row: place.row,
        table
      })
    }
  }

  return { tables: placed }
}

/** The block a table belongs to: tables `2k − 1` and `2k` host one encounter. */
export const blockOf = (table: TableNumber): [TableNumber, TableNumber] => {
  const first = table % 2 === 0 ? table - 1 : table

  return [first, first + 1]
}

export const isHiddenIn = (plan: HallPlan, table: TableNumber): boolean =>
  plan.tables.some(
    (candidate) => candidate.table === table && candidate.isHidden
  )

/** Puts a table at a place; a table already standing there takes its old one. */
export const placeHallTable = ({
  place,
  plan,
  table
}: {
  place: HallPlace
  plan: HallPlan
  table: TableNumber
}): HallPlan => {
  const moved = plan.tables.find((candidate) => candidate.table === table)

  if (moved === undefined) {
    return plan
  }

  return {
    tables: plan.tables.map((candidate) => {
      if (candidate.table === table) {
        return { ...candidate, column: place.column, row: place.row }
      }

      return isSamePlace(candidate, place)
        ? { ...candidate, column: moved.column, row: moved.row }
        : candidate
    })
  }
}

/**
 * Gives the table standing here another number: the table that had it comes
 * to this place, so numbers stay unique and every match keeps its table.
 */
export const renumberHallTable = ({
  number,
  plan,
  table
}: {
  number: TableNumber
  plan: HallPlan
  table: TableNumber
}): HallPlan => {
  const here = plan.tables.find((candidate) => candidate.table === table)

  return here === undefined
    ? plan
    : placeHallTable({ place: here, plan, table: number })
}

export const toggleHallTable = (
  plan: HallPlan,
  table: TableNumber
): HallPlan => ({
  tables: plan.tables.map((candidate) =>
    candidate.table === table
      ? { ...candidate, isHidden: !candidate.isHidden }
      : candidate
  )
})
