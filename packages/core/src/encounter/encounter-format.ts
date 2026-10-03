import type { MatchFormat } from '@scoreboard/protocol/match-format'

/** A line of a team sheet: two players by their letters, or a doubles by its number. */
export type SheetLine =
  | { away: string; home: string; kind: 'singles' }
  | { kind: 'doubles'; number: number }

/**
 * Points a match brings its team on the sheet. The winner's side always gets
 * `win`; the loser's depends on how it lost.
 */
export type MatchPoints = {
  /** Played to the end and lost. */
  loss: number
  /** Stopped during the match. */
  retirement: number
  /** Never played: absent, injured beforehand or refusing. */
  walkover: number
  win: number
}

/**
 * A team encounter as data: who plays whom, in which order, and what each
 * match is worth. A federation's format is one value of this type.
 */
export type EncounterFormat = {
  awayLetters: readonly string[]
  homeLetters: readonly string[]
  matchFormat: MatchFormat
  matchPoints: MatchPoints
  sheet: readonly SheetLine[]
}
