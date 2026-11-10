import {
  type FederationPoolReference,
  type FederationTeam,
  federationPoolReferenceSchema,
  federationTeamSchema
} from '@scoreboard/protocol/federation'

import { linkParamsOf, nameOf, textOf } from './smartping-fields'
import type { SmartpingItem } from './smartping-xml'

/** `A.P. ST SENOCH 2 - Phase 1`: the team's name, then its phase. */
const PHASE_SUFFIX = /\s+-\s+Phase\s+(\d)\s*$/i

/** The pool a `liendivision` link points to; `null` when it names none. */
export const poolReferenceOfLink = (
  params: URLSearchParams
): FederationPoolReference | null => {
  const parsed = federationPoolReferenceSchema.safeParse({
    division: params.get('D1') ?? '',
    organiser: params.get('organisme_pere') || undefined,
    pool: params.get('cx_poule') ?? ''
  })

  return parsed.success ? parsed.data : null
}

/** `xml_equipe`'s `<equipe>` rows; a malformed one is left out. */
export const teamsOf = (items: readonly SmartpingItem[]): FederationTeam[] =>
  items.flatMap((item) => {
    const label = nameOf(item, 'libequipe')
    const phase = PHASE_SUFFIX.exec(label)?.[1]
    const parsed = federationTeamSchema.safeParse({
      competition: nameOf(item, 'libepr'),
      division: nameOf(item, 'libdivision'),
      id: textOf(item, 'idequipe'),
      name: label.replace(PHASE_SUFFIX, ''),
      phase: phase === undefined ? null : Number(phase),
      pool: poolReferenceOfLink(linkParamsOf(item, 'liendivision'))
    })

    return parsed.success ? [parsed.data] : []
  })
