import type { ClubRecord } from '@scoreboard/protocol/club-record'
import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type { EventId } from '@scoreboard/protocol/identifiers'

import {
  isPlayedAtHome,
  type RoundEntry,
  roundEntriesOf
} from '@/features/club/round-entries'

/** One of our teams playing the day's round away: its name and the club it visits. */
export type AwayEncounter = { at: string; team: string }

/** What the club's calendar says of a match day. */
export type DayRound = {
  /** Our encounters played in another hall that day. */
  away: AwayEncounter[]
  /** Whether one of the round's home encounters is not in the day yet. */
  hasHomeToAdd: boolean
  /** The round's number when every pool plays the same one; `null` otherwise. */
  number: number | null
}

/** The round our teams play that day, read off their current pools, against what the day already holds. */
export const dayRoundOf = ({
  day,
  eventId,
  record,
  setup
}: {
  day: string
  eventId: EventId
  record: ClubRecord
  setup: EventSetup
}): DayRound => {
  const entries = roundEntriesOf(record, day)
  const numbers = [...new Set(entries.map((entry) => entry.at.roundIndex + 1))]
  const isInTheDay = ({ fixture }: RoundEntry) =>
    fixture.playedAs?.eventId === eventId &&
    setup.encounters.some(
      (encounter) => encounter.id === fixture.playedAs?.encounterId
    )

  return {
    away: entries.flatMap((entry) =>
      !isPlayedAtHome(entry) &&
      entry.away !== null &&
      entry.home !== null &&
      entry.home.club.id !== record.own.id
        ? [{ at: entry.home.club.name, team: entry.away.team.name }]
        : []
    ),
    hasHomeToAdd: entries.some(
      (entry) =>
        isPlayedAtHome(entry) && entry.away !== null && !isInTheDay(entry)
    ),
    number: numbers.length === 1 ? (numbers[0] ?? null) : null
  }
}
