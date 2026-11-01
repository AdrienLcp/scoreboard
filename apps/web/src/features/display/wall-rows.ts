import type { Player, Team } from '@scoreboard/protocol/event-setup'
import type {
  MatchView,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type {
  EncounterId,
  PlayerId,
  TableNumber
} from '@scoreboard/protocol/identifiers'
import type { CardPenalty } from '@scoreboard/protocol/scoring-event'
import { type Score, type Side, sides } from '@scoreboard/protocol/side'

import {
  DEFAULT_OPPONENT_COLOUR,
  textColourOn
} from '@scoreboard/core/club/team-colours'

/** More encounters than this and a row stops being legible: the open board takes over. */
export const MAX_WALL_ROWS = 6

/** A team as the wall paints it: its colour and the text that reads on it. */
export type TeamPaint = {
  colour: string
  /** White, the opponents' default: it needs an edge to hold on a white ground. */
  isWhite: boolean
  name: string
  textColour: string
}

/** One table of an encounter's row: the match played on it, or the one it waits for. */
export type WallTable = {
  live: MatchView | null
  next: MatchView | null
  table: TableNumber
}

/** One encounter on the wall: both teams, the parties won so far, its tables. */
export type WallRow = {
  away: TeamPaint
  home: TeamPaint
  id: EncounterId
  /** Every match of the encounter's sheet: cards follow a player from one to the next. */
  matches: readonly MatchView[]
  points: Score
  tables: WallTable[]
}

/** How a team is painted: its colour or the opponents' white, and the text that reads on it. */
export const paintOf = (team: Team | undefined): TeamPaint => {
  const colour = team?.colour ?? DEFAULT_OPPONENT_COLOUR

  return {
    colour,
    isWhite: colour.toUpperCase() === DEFAULT_OPPONENT_COLOUR,
    name: team?.name ?? '',
    textColour: textColourOn(colour)
  }
}

const lastMatchOn = (
  matches: readonly MatchView[],
  table: TableNumber
): MatchView | null =>
  matches.filter((match) => match.table === table).at(-1) ?? null

/** The match a table is on: the one played or awaited there, else the last it played. */
export const currentMatchOn = (
  snapshot: PublicSnapshot,
  table: TableNumber
): MatchView | null => {
  const currentId = snapshot.tables.find(
    (view) => view.number === table
  )?.matchId

  return (
    snapshot.matches.find((match) => match.id === currentId) ??
    lastMatchOn(snapshot.matches, table)
  )
}

/** A table as the wall shows it: its match live, or the one it waits for, or free. */
export const wallTableOf = (
  current: MatchView,
  table: TableNumber
): WallTable => ({
  live: current.state.status === 'live' ? current : null,
  next: current.state.status === 'scheduled' ? current : null,
  table
})

const wallTableFor = (
  snapshot: PublicSnapshot,
  table: TableNumber
): { encounterId: EncounterId | null; wallTable: WallTable } | null => {
  const current = currentMatchOn(snapshot, table)

  return current === null
    ? null
    : {
        encounterId: current.encounterId,
        wallTable: wallTableOf(current, table)
      }
}

/**
 * The wall's rows when every table this screen shows belongs to a team
 * encounter played on at most two tables, one row per encounter in table
 * order; `null` when the open board suits the day better.
 */
export const wallRowsFor = ({
  snapshot,
  tables
}: {
  snapshot: PublicSnapshot
  tables: readonly TableNumber[]
}): WallRow[] | null => {
  const byEncounter = new Map<EncounterId, WallTable[]>()

  for (const table of tables) {
    const found = wallTableFor(snapshot, table)

    if (found === null) {
      continue
    }

    if (found.encounterId === null) {
      return null
    }

    byEncounter.set(found.encounterId, [
      ...(byEncounter.get(found.encounterId) ?? []),
      found.wallTable
    ])
  }

  const groups = [...byEncounter]

  if (
    groups.length === 0 ||
    groups.length > MAX_WALL_ROWS ||
    groups.some(([, wallTables]) => wallTables.length > 2)
  ) {
    return null
  }

  return groups.flatMap(([encounterId, wallTables]): WallRow[] => {
    const encounter = snapshot.encounters.find(
      (candidate) => candidate.id === encounterId
    )

    if (encounter === undefined) {
      return []
    }

    const teamOf = (teamId: string) =>
      snapshot.teams.find((team) => team.id === teamId)

    return [
      {
        away: paintOf(teamOf(encounter.away)),
        home: paintOf(teamOf(encounter.home)),
        id: encounterId,
        matches: snapshot.matches.filter(
          (match) => match.encounterId === encounterId
        ),
        points: snapshot.encounterViews.find((view) => view.id === encounterId)
          ?.points ?? { away: 0, home: 0 },
        tables: wallTables
      }
    ]
  })
}

const SINGLES_LABEL = /^([A-Z])([A-Z])$/

/** "BX" → home B, away X: the letters a singles line of the sheet gives its players. */
const singlesLettersOf = (
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

/** Each player's letter on the sheet, read from the singles he plays in the encounter. */
const lettersByPlayer = (
  matches: readonly MatchView[]
): Map<PlayerId, string> => {
  const letters = new Map<PlayerId, string>()

  for (const match of matches) {
    const lineLetters = singlesLettersOf(match.label)

    for (const side of sides) {
      const [playerId] = match[side].playerIds

      if (lineLetters !== null && playerId !== undefined) {
        letters.set(playerId, lineLetters[side])
      }
    }
  }

  return letters
}

/** One player in a chip: his sheet letter, his name and his ranking points when known. */
export type ChipPlayer = {
  id: PlayerId
  name: string
  points: number | null
}

/** The side of a live match as its chip shows it: one letter square and one line per player. */
export type WallSide = {
  /** The worst card a player of this side carries in the encounter, `null` without one. */
  card: CardPenalty | null
  letters: string
  players: ChipPlayer[]
}

const worseCard = (
  current: CardPenalty | null,
  next: CardPenalty
): CardPenalty => (current === null || next > current ? next : current)

export const wallSideOf = ({
  match,
  matches,
  players,
  side
}: {
  match: MatchView
  /** Every match of the encounter. */
  matches: readonly MatchView[]
  players: readonly Player[]
  side: Side
}): WallSide => {
  const { playerIds } = match[side]
  const letters = lettersByPlayer(matches)
  const lineLetters = singlesLettersOf(match.label)
  let card: CardPenalty | null = null

  for (const shown of matches.flatMap((candidate) => candidate.state.cards)) {
    const isOnThisSide =
      shown.playerId === null
        ? match.state.cards.includes(shown) && shown.side === side
        : playerIds.includes(shown.playerId)

    if (isOnThisSide) {
      card = worseCard(card, shown.penalty)
    }
  }

  return {
    card,
    letters:
      lineLetters?.[side] ??
      playerIds.map((playerId) => letters.get(playerId) ?? '').join(''),
    players: playerIds.flatMap((playerId) => {
      const player = players.find((candidate) => candidate.id === playerId)

      return player === undefined
        ? []
        : [{ id: player.id, name: player.name, points: player.points }]
    })
  }
}
