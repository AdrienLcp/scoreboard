import type { MatchFormat } from '@scoreboard/protocol/match-format'

/**
 * Which table of the encounter's tables a line is played on: a 6-player sheet
 * runs its two groups of three side by side, ABC–XYZ on the first table and
 * DEF–RST on the second.
 */
export type SheetGroup = 1 | 2

/** A line of a team sheet: two players by their letters, or a doubles by its number. */
export type SheetLine = { group: SheetGroup } & (
  | { away: string; home: string; kind: 'singles' }
  | { kind: 'doubles'; number: number }
)

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
 * A team encounter as data: who plays whom, in which order, on how many
 * tables. What each match is worth comes from the competition, apart.
 */
export type EncounterFormat = {
  awayLetters: readonly string[]
  /** How many tables the encounter runs on at once: one per group of its sheet. */
  groupCount: SheetGroup
  homeLetters: readonly string[]
  matchFormat: MatchFormat
  sheet: readonly SheetLine[]
}
