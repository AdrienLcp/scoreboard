import {
  type FederationEncounterReference,
  federationEncounterReferenceSchema
} from '@scoreboard/protocol/federation'

/** The parameters of `<tour><lien>` that `xml_chp_renc` reads, by our name for each: nothing else is forwarded. */
const LINK_PARAMS: readonly (readonly [
  keyof FederationEncounterReference,
  string
])[] = [
  ['awayClubNumber', 'clubnum_2'],
  ['awayScore', 'res_2'],
  ['awayTeam', 'equip_2'],
  ['awayTeamId', 'equip_id2'],
  ['encounterId', 'renc_id'],
  ['homeClubNumber', 'clubnum_1'],
  ['homeScore', 'res_1'],
  ['homeTeam', 'equip_1'],
  ['homeTeamId', 'equip_id1'],
  ['isReturn', 'is_retour'],
  ['phase', 'phase']
]

/** An encounter's reference, read from the federation's link; `null` when the link is not one. */
export const encounterReferenceOfLink = (
  params: URLSearchParams
): FederationEncounterReference | null => {
  const parsed = federationEncounterReferenceSchema.safeParse(
    Object.fromEntries(
      LINK_PARAMS.map(([name, param]) => [name, params.get(param) ?? ''])
    )
  )

  return parsed.success ? parsed.data : null
}

/** The link rebuilt from a reference, the whole of it, as the FFTT handed it out. */
export const linkParamsOfEncounter = (
  reference: FederationEncounterReference
): Record<string, string> =>
  Object.fromEntries(
    LINK_PARAMS.map(([name, param]) => [param, reference[name]])
  )
