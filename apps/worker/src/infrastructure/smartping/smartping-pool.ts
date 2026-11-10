import {
  type FederationFixture,
  type FederationRound,
  type FederationStanding,
  federationFixtureSchema,
  federationStandingSchema
} from '@scoreboard/protocol/federation'

import { encounterReferenceOfLink } from './smartping-encounter-link'
import {
  encounterScoreOf,
  isoDateOf,
  linkParamsOf,
  nameOf,
  textOf,
  wholeNumberOf
} from './smartping-fields'
import type { SmartpingItem } from './smartping-xml'

const orNull = (text: string) => text || null

/**
 * `xml_result_equ&action=classement`'s rows. A rank of `-` ties the row with
 * the one above; the rank is `clt` in the spec, `classement` in one client,
 * so both are read. A row without a team is left out.
 */
export const standingsOf = (
  items: readonly SmartpingItem[]
): FederationStanding[] => {
  const standings: FederationStanding[] = []
  let previousRank = 0

  for (const item of items) {
    const rankText = textOf(item, 'clt') || textOf(item, 'classement')
    const rank =
      rankText === '-'
        ? previousRank
        : (wholeNumberOf(rankText) ?? standings.length + 1)
    const parsed = federationStandingSchema.safeParse({
      clubNumber: orNull(textOf(item, 'numero')),
      gamesLost: wholeNumberOf(textOf(item, 'pp')),
      gamesWon: wholeNumberOf(textOf(item, 'pg')),
      played: wholeNumberOf(textOf(item, 'joue')) ?? 0,
      points: wholeNumberOf(textOf(item, 'pts')) ?? 0,
      rank,
      team: nameOf(item, 'equipe'),
      teamId: orNull(textOf(item, 'idequipe'))
    })

    if (parsed.success) {
      standings.push(parsed.data)
      previousRank = parsed.data.rank
    }
  }

  return standings
}

/** `Poule 4 - tour n°1 du 16/12/2022`. */
const ROUND_LABEL = /tour\s+n\S*?\s*(\d+)(?:\s+du\s+(\d{2}\/\d{2}\/\d{4}))?/i

type DatedFixture = {
  date: string | null
  fixture: FederationFixture
  round: number
}

const datedFixtureOf = (item: SmartpingItem): DatedFixture | null => {
  const label = ROUND_LABEL.exec(textOf(item, 'libelle'))
  const link = linkParamsOf(item, 'lien')
  const parsed = federationFixtureSchema.safeParse({
    awayClubNumber: orNull(
      textOf(item, 'nclubb') || (link.get('clubnum_2') ?? '')
    ),
    awayScore: encounterScoreOf(textOf(item, 'scoreb')),
    awayTeam: nameOf(item, 'equb'),
    encounter: encounterReferenceOfLink(link),
    homeClubNumber: orNull(
      textOf(item, 'ncluba') || (link.get('clubnum_1') ?? '')
    ),
    homeScore: encounterScoreOf(textOf(item, 'scorea')),
    homeTeam: nameOf(item, 'equa')
  })

  if (label === null || !parsed.success) {
    return null
  }

  return {
    date: isoDateOf(textOf(item, 'dateprevue')) ?? isoDateOf(label[2] ?? ''),
    fixture: parsed.data,
    round: Number(label[1])
  }
}

const isBye = ({ fixture }: DatedFixture) =>
  fixture.homeTeam === '' || fixture.awayTeam === ''

/**
 * `xml_result_equ`'s `<tour>` rows, one per encounter, grouped into rounds by
 * the number their label carries. A bye, an empty side, is left out.
 */
export const roundsOf = (
  items: readonly SmartpingItem[]
): FederationRound[] => {
  const rounds = new Map<number, FederationRound>()

  for (const item of items) {
    const dated = datedFixtureOf(item)

    if (dated === null || isBye(dated)) {
      continue
    }

    const round = rounds.get(dated.round) ?? {
      date: dated.date,
      fixtures: [],
      number: dated.round
    }
    round.fixtures.push(dated.fixture)
    rounds.set(dated.round, round)
  }

  return [...rounds.values()].sort((a, b) => a.number - b.number)
}
