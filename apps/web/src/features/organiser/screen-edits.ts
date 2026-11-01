import type { Display, EventSetup } from '@scoreboard/protocol/event-setup'
import type { DisplayId, TableNumber } from '@scoreboard/protocol/identifiers'
import type { WallView } from '@scoreboard/protocol/wall-view'

import { tableRange } from './setup-edits'

/** Fewer tables than this and a third of them is not worth a screen. */
const MIN_TABLES_IN_THIRDS = 6

const editDisplay = (
  setup: EventSetup,
  displayId: DisplayId,
  edit: (display: Display) => Display
): EventSetup => ({
  ...setup,
  displays: setup.displays.map((display) =>
    display.id === displayId ? edit(display) : display
  )
})

/**
 * The setup with a screen's view set: a display's own, or the event's for the
 * screen showing every table, `null`.
 */
export const withScreenView = (
  setup: EventSetup,
  displayId: DisplayId | null,
  view: WallView
): EventSetup =>
  displayId === null
    ? { ...setup, wallView: view }
    : editDisplay(setup, displayId, (display) => ({ ...display, view }))

export const withDisplayTables = (
  setup: EventSetup,
  displayId: DisplayId,
  tables: readonly TableNumber[]
): EventSetup =>
  editDisplay(setup, displayId, (display) => ({
    ...display,
    tables: [...tables]
  }))

/** The shares of the hall's tables a screen can show: all of them, then each half, then each third. */
export const tableSharesOf = (tableCount: number): TableNumber[][] => {
  const partsOf = (count: number): TableNumber[][] =>
    Array.from({ length: count }, (_, index) =>
      tableRange({
        first: Math.floor((index * tableCount) / count) + 1,
        last: Math.floor(((index + 1) * tableCount) / count)
      })
    )
  const shares = [
    tableRange({ first: 1, last: tableCount }),
    ...(tableCount >= 2 ? partsOf(2) : []),
    ...(tableCount >= MIN_TABLES_IN_THIRDS ? partsOf(3) : [])
  ]

  return shares.filter(
    (share, index) =>
      share.length > 0 &&
      shares.findIndex((other) => other.join() === share.join()) === index
  )
}

/**
 * The tables a new screen shows first: the first half, then third, that no
 * display shows yet; every table once each is shown.
 */
export const nextShareOf = (setup: EventSetup): TableNumber[] => {
  const shares = tableSharesOf(setup.tableCount)
  const shown = new Set(setup.displays.map(({ tables }) => tables.join()))

  return (
    shares.slice(1).find((share) => !shown.has(share.join())) ?? shares[0] ?? []
  )
}

/** The setup with one more screen, showing the next share of the tables. */
export const withNewDisplay = (
  setup: EventSetup,
  { id, name }: Pick<Display, 'id' | 'name'>
): EventSetup => ({
  ...setup,
  displays: [...setup.displays, { id, name, tables: nextShareOf(setup) }]
})
