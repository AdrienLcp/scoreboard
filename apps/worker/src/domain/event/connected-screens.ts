import type { ConnectedScreen } from '@scoreboard/protocol/event-snapshot'
import type { DisplayId } from '@scoreboard/protocol/identifiers'

import type { Admission } from './admission'

/**
 * The screens the room's open sockets show, each with its TVs, in the order
 * they first joined; a display that never said which screen counts for none.
 */
export const connectedScreensOf = (
  admissions: readonly (Admission | null)[]
): ConnectedScreen[] => {
  const tvCounts = new Map<DisplayId | null, number>()

  for (const admission of admissions) {
    if (admission?.role !== 'display' || admission.displayId === undefined) {
      continue
    }

    tvCounts.set(
      admission.displayId,
      (tvCounts.get(admission.displayId) ?? 0) + 1
    )
  }

  return [...tvCounts].map(([displayId, tvCount]) => ({ displayId, tvCount }))
}
