import {
  type FederationPlayer,
  federationPlayerSchema
} from '@scoreboard/protocol/federation'

import {
  nameOf,
  rankingPointsOf,
  textOf,
  wholeNumberOf
} from './smartping-fields'
import type { SmartpingItem } from './smartping-xml'

const sexOf = (text: string) => (text === 'M' || text === 'F' ? text : null)

/** A malformed licensee is left out of the list rather than failing it. */
const validPlayers = (candidates: readonly unknown[]): FederationPlayer[] =>
  candidates.flatMap((candidate) => {
    const parsed = federationPlayerSchema.safeParse(candidate)

    return parsed.success ? [parsed.data] : []
  })

/** Official points: whole, and 0 for a licensee the federation has not ranked. */
const officialPointsOf = (text: string) => {
  const points = wholeNumberOf(text)

  return points === null || points === 0 ? null : points
}

/**
 * `xml_licence_b`'s `<licence>` rows: `point` holds the phase's official
 * points, `pointm` the month's.
 */
export const playersOfLicences = (
  items: readonly SmartpingItem[]
): FederationPlayer[] =>
  validPlayers(
    items.map((item) => ({
      category: textOf(item, 'cat') || null,
      clubName: nameOf(item, 'nomclub'),
      clubNumber: textOf(item, 'numclub') || null,
      firstName: nameOf(item, 'prenom'),
      lastName: nameOf(item, 'nom'),
      licence: textOf(item, 'licence'),
      monthlyPoints: rankingPointsOf(textOf(item, 'pointm')),
      points: officialPointsOf(textOf(item, 'point')),
      sex: sexOf(textOf(item, 'sexe'))
    }))
  )

/**
 * `xml_liste_joueur_o`'s `<joueur>` rows. Its `club` is the club's number and
 * `nclub` its name, the reverse of `xml_liste_joueur`; it gives no monthly
 * points and no category.
 */
export const playersOfSpidList = (
  items: readonly SmartpingItem[]
): FederationPlayer[] =>
  validPlayers(
    items.map((item) => ({
      category: null,
      clubName: nameOf(item, 'nclub'),
      clubNumber: textOf(item, 'club') || null,
      firstName: nameOf(item, 'prenom'),
      lastName: nameOf(item, 'nom'),
      licence: textOf(item, 'licence'),
      monthlyPoints: null,
      points: officialPointsOf(textOf(item, 'points')),
      sex: sexOf(textOf(item, 'sexe'))
    }))
  )
