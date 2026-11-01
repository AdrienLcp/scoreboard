import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type { CreateEventInput } from '@scoreboard/protocol/routes'

/**
 * The setup an event opens with: its name, format, club and hall as the
 * device sent them, and the programme prepared with it (a match day's
 * encounters), otherwise nothing yet.
 */
export const initialSetupOf = (input: CreateEventInput): EventSetup => ({
  club: input.club,
  defaultFormat: input.format,
  displays: [],
  encounters: input.programme?.encounters ?? [],
  hall: input.hall,
  matches: input.programme?.matches ?? [],
  name: input.name,
  players: input.programme?.players ?? [],
  startsAtMs: null,
  tableCount: input.tableCount,
  teams: input.programme?.teams ?? []
})
