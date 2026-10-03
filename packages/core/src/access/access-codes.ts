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

/** A uniformly random integer in `[0, size)`, from a cryptographic source in production. */
export type RandomIndex = (size: number) => number

const randomCode = ({
  alphabet,
  length,
  randomIndex
}: {
  alphabet: string
  length: number
  randomIndex: RandomIndex
}): string =>
  Array.from(
    { length },
    () => alphabet[randomIndex(alphabet.length)] ?? ''
  ).join('')

export const newEventId = (randomIndex: RandomIndex): EventId =>
  randomCode({
    alphabet: EVENT_ID_ALPHABET,
    length: EVENT_ID_LENGTH,
    randomIndex
  })

export const newOrganiserCode = (randomIndex: RandomIndex): OrganiserCode =>
  randomCode({
    alphabet: ACCESS_CODE_ALPHABET,
    length: ORGANISER_CODE_LENGTH,
    randomIndex
  })

const newUmpireCode = (randomIndex: RandomIndex): UmpireCode =>
  randomCode({
    alphabet: ACCESS_CODE_ALPHABET,
    length: UMPIRE_CODE_LENGTH,
    randomIndex
  })

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
  randomIndex,
  tableCount
}: {
  existing: readonly TableAccess[]
  randomIndex: RandomIndex
  tableCount: number
}): TableAccess[] => {
  const taken = new Set(existing.map((access) => access.code))

  const freshCode = (): UmpireCode => {
    const code = newUmpireCode(randomIndex)

    if (taken.has(code)) {
      return freshCode()
    }

    taken.add(code)

    return code
  }

  return tableNumbers(tableCount).map((table: TableNumber) => {
    const kept = existing.find((access) => access.table === table)

    return kept ?? { code: freshCode(), table }
  })
}
