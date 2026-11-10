import {
  type FederationEncounter,
  type FederationGame,
  type FederationSet,
  type FederationSheetPlayer,
  federationGameSchema,
  federationSheetPlayerSchema
} from '@scoreboard/protocol/federation'

import { encounterScoreOf, nameOf, textOf } from './smartping-fields'
import type { SmartpingList } from './smartping-xml'

/** `M 1124pts`, `N°281- F 1560pts`, or bare points. */
const SHEET_RANKING = /^(?:N\S*?\s*\d*\s*-\s*)?(?:([MF])\s+)?(\d+)\s*(?:pts)?$/i

const sheetPlayerOf = (
  name: string,
  ranking: string
): FederationSheetPlayer | null => {
  if (name === '' || /^absent$/i.test(name)) {
    return null
  }

  const match = SHEET_RANKING.exec(ranking)
  const sex = match?.[1]?.toUpperCase()
  const parsed = federationSheetPlayerSchema.safeParse({
    name,
    points: match === null ? null : Number(match[2]),
    sex: sex === 'M' || sex === 'F' ? sex : null
  })

  return parsed.success ? parsed.data : null
}

/** A set's signed score from the home side: `06` won 11–6, `-09` lost 9–11, `12` won 14–12; `-00` is a set lost to love. */
export const setOf = (signed: string): FederationSet | null => {
  const match = /^(-?)(\d{1,2})$/.exec(signed)

  if (match === null) {
    return null
  }

  const loserPoints = Number(match[2])
  const winnerPoints = Math.max(11, loserPoints + 2)

  return match[1] === '-'
    ? { away: winnerPoints, home: loserPoints }
    : { away: loserPoints, home: winnerPoints }
}

const setsOf = (detail: string): FederationSet[] =>
  detail
    .split(/\s+/)
    .map(setOf)
    .filter((set) => set !== null)

/** A double is `NOM1 Prénom1 et NOM2 Prénom2`. */
const playersOfGame = (names: string) =>
  names === '' ? [] : names.split(' et ').map((name) => name.trim())

const gamePointsOf = (text: string) =>
  /^\d{1,2}$/.test(text) ? Number(text) : null

const gamesOf = (list: SmartpingList): FederationGame[] =>
  (list.partie ?? []).flatMap((item) => {
    const parsed = federationGameSchema.safeParse({
      awayPlayers: playersOfGame(nameOf(item, 'jb')),
      awayPoints: gamePointsOf(textOf(item, 'scoreb')),
      homePlayers: playersOfGame(nameOf(item, 'ja')),
      homePoints: gamePointsOf(textOf(item, 'scorea')),
      sets: setsOf(textOf(item, 'detail'))
    })

    return parsed.success ? [parsed.data] : []
  })

/** An empty score on the sheet is the sum of its games' points. */
const totalOf = (
  scoreText: string,
  games: readonly FederationGame[],
  side: 'awayPoints' | 'homePoints'
) =>
  encounterScoreOf(scoreText) ??
  (games.length === 0
    ? null
    : games.reduce((total, game) => total + (game[side] ?? 0), 0))

/**
 * `xml_chp_renc`'s sheet: the result, one `<joueur>` row per pair of players,
 * one `<partie>` per game. `null` while the federation has no sheet: before
 * the encounter it answers an empty list.
 */
export const encounterOf = (
  list: SmartpingList
): FederationEncounter | null => {
  const result = list.resultat?.[0]
  const rows = list.joueur ?? []
  const games = gamesOf(list)

  if (result === undefined && rows.length === 0 && games.length === 0) {
    return null
  }

  const players = (nameField: string, rankingField: string) =>
    rows
      .map((row) =>
        sheetPlayerOf(nameOf(row, nameField), textOf(row, rankingField))
      )
      .filter((player) => player !== null)

  return {
    awayPlayers: players('xjb', 'xcb'),
    awayScore: totalOf(
      result ? textOf(result, 'resb') : '',
      games,
      'awayPoints'
    ),
    awayTeam: result ? nameOf(result, 'equb') : '',
    games,
    homePlayers: players('xja', 'xca'),
    homeScore: totalOf(
      result ? textOf(result, 'resa') : '',
      games,
      'homePoints'
    ),
    homeTeam: result ? nameOf(result, 'equa') : ''
  }
}
