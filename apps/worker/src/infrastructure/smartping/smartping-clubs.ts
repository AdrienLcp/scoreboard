import {
  type FederationClub,
  federationClubSchema
} from '@scoreboard/protocol/federation'

import { nameOf, textOf } from './smartping-fields'
import type { SmartpingItem } from './smartping-xml'

/** `xml_club_b` and `xml_club_dep2`'s `<club>` rows; a malformed one is left out. */
export const clubsOf = (items: readonly SmartpingItem[]): FederationClub[] =>
  items.flatMap((item) => {
    const parsed = federationClubSchema.safeParse({
      name: nameOf(item, 'nom'),
      number: textOf(item, 'numero')
    })

    return parsed.success ? [parsed.data] : []
  })
