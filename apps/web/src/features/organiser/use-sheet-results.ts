import { useEffect } from 'react'

import type { PublicSnapshot } from '@scoreboard/protocol/event-snapshot'
import type { EventId } from '@scoreboard/protocol/identifiers'

import { withEventSheets } from '@/features/club/championship-edits'
import { useClub } from '@/features/club/use-club'

/**
 * Writes each finished sheet of the day into the championship fixture it was
 * created for, and writes it again when a correction changes it: the club's
 * standings follow the hall without anyone typing a score.
 */
export const useSheetResults = ({
  event,
  eventId
}: {
  event: PublicSnapshot | null
  eventId: EventId
}) => {
  const { edit, state } = useClub()
  const isReady = state.status === 'ready'

  useEffect(() => {
    if (isReady && event !== null) {
      edit((record) =>
        withEventSheets({
          encounters: event.encounters,
          eventId,
          record,
          views: event.encounterViews
        })
      )
    }
  }, [edit, event, eventId, isReady])
}
