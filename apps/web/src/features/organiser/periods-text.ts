import type { Score } from '@scoreboard/protocol/side'

const PERIOD_PATTERN = /^(\d{1,3})-(\d{1,3})$/

/**
 * Reads a score typed by the organiser, game by game: `11-7 6-4` is a first
 * game won 11-7 and a second standing at 6-4. `null` when a part is not a
 * score; whether the games make sense is the ruleset's call.
 */
export const parsePeriodsText = (text: string): Score[] | null => {
  const parts = text
    .trim()
    .split(/[\s,;]+/)
    .filter((part) => part !== '')
  const periods = parts.map((part) => {
    const matched = PERIOD_PATTERN.exec(part.replace(/[–—]/g, '-'))

    return matched === null
      ? null
      : { away: Number(matched[2]), home: Number(matched[1]) }
  })

  return periods.every((period): period is Score => period !== null)
    ? periods
    : null
}

export const periodsText = (periods: readonly Score[]): string =>
  periods.map((period) => `${period.home}-${period.away}`).join(' ')
