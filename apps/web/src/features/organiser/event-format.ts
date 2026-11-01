import type { EventSetup } from '@scoreboard/protocol/event-setup'

/** How a day is played: team encounters, pools then a bracket, or matches one by one. */
export type EventFormat = 'championship' | 'free' | 'pools'

export const EVENT_FORMATS: readonly EventFormat[] = [
  'championship',
  'pools',
  'free'
]

/** The format a setup already plays; `null` while nothing is prepared. */
export const eventFormatOf = (setup: EventSetup): EventFormat | null => {
  if ((setup.tournament ?? null) !== null) {
    return 'pools'
  }

  if (setup.encounters.length > 0) {
    return 'championship'
  }

  return setup.matches.length > 0 ? 'free' : null
}
