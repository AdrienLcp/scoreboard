import type { SmartpingItem } from './smartping-xml'

/** A field's text, trimmed; `''` for an absent or empty element. */
export const textOf = (item: SmartpingItem, field: string): string => {
  const value = item[field]

  return typeof value === 'string' ? value.trim() : ''
}

/** A name with its runs of spaces collapsed: the FFTT writes `AMOR   QUOINTEAU Erwan`. */
export const nameOf = (item: SmartpingItem, field: string): string =>
  textOf(item, field).replace(/\s+/g, ' ')

/** A whole number, or `null` for an empty or non-numeric value. `710.` and `1368.62` round to the nearest whole. */
export const wholeNumberOf = (text: string): number | null =>
  /^\d+(?:\.\d*)?$/.test(text) ? Math.round(Number(text)) : null

/** The scale's floor and ceiling: a value outside it is no ranking. */
const MIN_RANKING_POINTS = 500
const MAX_RANKING_POINTS = 5000

/**
 * Points on the FFTT's scale, or `null`. A numbered player's monthly points
 * can hold something else (`28` for a n°5), so a value below the scale's
 * floor is not shown as points.
 */
export const rankingPointsOf = (text: string): number | null => {
  const points = wholeNumberOf(text)

  return points !== null &&
    points >= MIN_RANKING_POINTS &&
    points <= MAX_RANKING_POINTS
    ? points
    : null
}

const FFTT_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/

/** `dd/mm/yyyy`, the FFTT's dates, as an ISO calendar date; `null` when absent or malformed. */
export const isoDateOf = (text: string): string | null => {
  const match = FFTT_DATE.exec(text)

  if (match === null) {
    return null
  }

  const [, day = '', month = '', year = ''] = match
  const monthNumber = Number(month)
  const dayNumber = Number(day)

  return monthNumber >= 1 &&
    monthNumber <= 12 &&
    dayNumber >= 1 &&
    dayNumber <= 31
    ? `${year}-${month}-${day}`
    : null
}

/** An encounter's score: digits, or `F0` for a forfeit; `null` before it is played. */
export const encounterScoreOf = (text: string): number | null => {
  const match = /^F?(\d{1,3})$/.exec(text)

  return match === null ? null : Number(match[1])
}

/** The `cx_poule=…&D1=…` links the FFTT hands out, read as parameters. */
export const linkParamsOf = (item: SmartpingItem, field: string) =>
  new URLSearchParams(textOf(item, field))
