import type { TableAccess } from '@scoreboard/protocol/event-snapshot'
import {
  ACCESS_CODE_ALPHABET,
  EVENT_ID_ALPHABET,
  EVENT_ID_LENGTH,
  type EventId,
  ORGANISER_CODE_LENGTH,
  type OrganiserCode,
  type TableNumber,
  UMPIRE_CODE_LENGTH,
  type UmpireCode,
  umpireCodeSchema
} from '@scoreboard/protocol/identifiers'

import { tableNumbers } from '../event/table-queue'

/** Draws `length` characters from `alphabet`, from a cryptographic source in production. */
export type DrawCode = (alphabet: string, length: number) => string

export const newEventId = (drawCode: DrawCode): EventId =>
  drawCode(EVENT_ID_ALPHABET, EVENT_ID_LENGTH)

export const newOrganiserCode = (drawCode: DrawCode): OrganiserCode =>
  drawCode(ACCESS_CODE_ALPHABET, ORGANISER_CODE_LENGTH)

const newUmpireCode = (drawCode: DrawCode): UmpireCode =>
  drawCode(ACCESS_CODE_ALPHABET, UMPIRE_CODE_LENGTH)

const CODE_SEPARATORS = /[\s-]/g

/** What a person typed, read as an umpire code: case and spacing forgiven. */
export const parseUmpireCode = (typed: string): UmpireCode | null => {
  const parsed = umpireCodeSchema.safeParse(
    typed.replace(CODE_SEPARATORS, '').toUpperCase()
  )

  return parsed.success ? parsed.data : null
}

/**
 * One umpire code per table. A table keeps its code across saves, so the QR
 * code taped on it stays valid; a new table gets a fresh one.
 */
export const tableAccessesFor = ({
  existing,
  drawCode,
  tableCount
}: {
  existing: readonly TableAccess[]
  drawCode: DrawCode
  tableCount: number
}): TableAccess[] => {
  const taken = new Set(existing.map((access) => access.code))

  const freshCode = (): UmpireCode => {
    let code = newUmpireCode(drawCode)

    while (taken.has(code)) {
      code = newUmpireCode(drawCode)
    }

    taken.add(code)

    return code
  }

  return tableNumbers(tableCount).map((table: TableNumber) => {
    const kept = existing.find((access) => access.table === table)

    return kept ?? { code: freshCode(), table }
  })
}
