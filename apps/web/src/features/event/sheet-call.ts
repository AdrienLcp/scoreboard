import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { Side } from '@scoreboard/protocol/side'

const SINGLES_LABEL = /^([A-Z])([A-Z])$/

/** "BX" → home B, away X: the letters a singles line of the sheet gives its players. */
export const singlesLettersOf = (
  label: string | null
): Record<Side, string> | null => {
  const found = label === null ? null : SINGLES_LABEL.exec(label)

  return found === null ? null : { away: found[2] ?? '', home: found[1] ?? '' }
}

/** "B – X" for a singles line of the sheet, the line's own label otherwise ("Double 1"). */
export const wallCallOf = (match: MatchView): string | null => {
  const letters = singlesLettersOf(match.label)

  return letters === null ? match.label : `${letters.home} – ${letters.away}`
}
