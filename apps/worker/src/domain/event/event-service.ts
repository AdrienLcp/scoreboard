import { Result } from '@adrienlcp/result'

import type { Credentials } from '@scoreboard/protocol/client-message'
import type {
  ProtocolErrorCode,
  RecordRefusal,
  SetupRefusal
} from '@scoreboard/protocol/error-code'
import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type {
  MatchId,
  OrganiserCode,
  TableNumber
} from '@scoreboard/protocol/identifiers'
import type {
  CreatedEvent,
  CreateEventInput
} from '@scoreboard/protocol/routes'
import type {
  InstantMs,
  ScoringEvent
} from '@scoreboard/protocol/scoring-event'

import {
  type DrawCode,
  newEventId,
  newOrganiserCode,
  tableAccessesFor
} from '@scoreboard/core/access/access-codes'
import {
  checkEventSetup,
  checkSetupChange
} from '@scoreboard/core/event/event-setup-check'
import { initialSetupOf } from '@scoreboard/core/event/initial-setup'
import { resumeWaitingMatchOn } from '@scoreboard/core/hall/table-put-away'
import {
  describeMatch,
  recordScoringEvent
} from '@scoreboard/core/match/match-log'

import type { Admission } from './admission'
import type { EventRooms } from './event-rooms'
import type { EventStore } from './event-store'

/** Opens a new event, empty or with the programme prepared for it, once. */
export const openEvent = ({
  input,
  organiserCode,
  drawCode,
  store
}: {
  input: CreateEventInput
  organiserCode: OrganiserCode
  drawCode: DrawCode
  store: EventStore
}): Result<void, 'already_open'> => {
  if (store.readSetup() !== null) {
    return Result.failure('already_open')
  }

  store.writeSetup(initialSetupOf(input))
  store.writeOrganiserCode(organiserCode)
  store.writeTableAccesses(
    tableAccessesFor({
      drawCode,
      existing: [],
      tableCount: input.tableCount
    })
  )

  return Result.success()
}

/** Checks a hello's credentials against the event's codes. */
export const admit = (
  store: EventStore,
  credentials: Credentials
): Result<
  Admission,
  Extract<ProtocolErrorCode, 'event_not_found' | 'wrong_code'>
> => {
  if (store.readSetup() === null) {
    return Result.failure('event_not_found')
  }

  switch (credentials.role) {
    case 'display':
      return Result.success(
        credentials.displayId === undefined
          ? { role: 'display' }
          : { displayId: credentials.displayId, role: 'display' }
      )
    case 'spectator':
      return Result.success({ role: 'spectator' })
    case 'organiser':
      return credentials.code === store.readOrganiserCode()
        ? Result.success({ role: 'organiser' })
        : Result.failure('wrong_code')
    case 'umpire': {
      const access = store
        .readTableAccesses()
        .find((candidate) => candidate.code === credentials.code)

      return access === undefined
        ? Result.failure('wrong_code')
        : Result.success({ role: 'umpire', table: access.table })
    }
  }
}

/**
 * Records a scoring event. An umpire scores the matches of their own table;
 * the organiser any match. `duplicate` succeeds: the device only needs to
 * hear the event is held.
 */
export const recordEvent = ({
  admission,
  event,
  matchId,
  nowMs,
  store
}: {
  admission: Admission
  event: ScoringEvent
  matchId: MatchId
  /** Stamped on the event: the server's clock, never the device's. */
  nowMs: InstantMs
  store: EventStore
}): Result<'recorded' | 'duplicate', RecordRefusal | 'not_allowed'> => {
  if (admission.role === 'display' || admission.role === 'spectator') {
    return Result.failure('not_allowed')
  }

  const setup = store.readSetup()
  const match = setup?.matches.find((candidate) => candidate.id === matchId)

  if (setup === null || match === undefined) {
    return Result.failure('match_not_found')
  }

  if (admission.role === 'umpire' && match.table !== admission.table) {
    return Result.failure('match_not_on_table')
  }

  const log = (store.readLogs().get(matchId) ?? []).map(
    (stamped) => stamped.event
  )
  const recorded = recordScoringEvent({ event, format: match.format, log })

  if (recorded.status === 'failure') {
    const refusal = recorded.error

    return refusal === 'duplicate'
      ? Result.success('duplicate')
      : Result.failure(refusal)
  }

  store.appendScoringEvent(matchId, { event, recordedAtMs: nowMs })

  const hasEndedNow =
    describeMatch(match.format, log).status === 'live' &&
    describeMatch(match.format, recorded.data).status === 'finished'

  if (hasEndedNow && match.table !== null) {
    resumeWaitingMatchOnFreedTable({ setup, store, table: match.table })
  }

  return Result.success('recorded')
}

/** A table whose match just ended takes the first match left waiting for one. */
const resumeWaitingMatchOnFreedTable = ({
  setup,
  store,
  table
}: {
  setup: EventSetup
  store: EventStore
  table: TableNumber
}): void => {
  const logs = store.readLogs()
  const resumed = resumeWaitingMatchOn({
    setup,
    statusOf: (matchId) => {
      const match = setup.matches.find((candidate) => candidate.id === matchId)
      const log = logs.get(matchId)

      return match === undefined || log === undefined
        ? 'scheduled'
        : describeMatch(
            match.format,
            log.map((stamped) => stamped.event)
          ).status
    },
    table
  })

  if (resumed !== setup) {
    store.writeSetup(resumed)
  }
}

/** Replaces the organiser's setup, keeping each remaining table's umpire code. */
export const saveSetup = ({
  admission,
  drawCode,
  setup,
  store
}: {
  admission: Admission
  drawCode: DrawCode
  setup: EventSetup
  store: EventStore
}): Result<void, SetupRefusal | 'not_allowed'> => {
  if (admission.role !== 'organiser') {
    return Result.failure('not_allowed')
  }

  const checked = checkEventSetup(setup)

  if (checked.status === 'failure') {
    return checked
  }

  const previous = store.readSetup()
  const changed =
    previous === null
      ? checked
      : checkSetupChange({
          next: checked.data,
          previous,
          startedMatchIds: new Set(store.readLogs().keys())
        })

  if (changed.status === 'failure') {
    return changed
  }

  store.writeSetup(checked.data)
  store.writeTableAccesses(
    tableAccessesFor({
      drawCode,
      existing: store.readTableAccesses(),
      tableCount: checked.data.tableCount
    })
  )

  return Result.success()
}

/** Erases the event on the organiser's word, ahead of its retention. */
export const deleteEvent = ({
  admission,
  store
}: {
  admission: Admission
  store: EventStore
}): Result<void, 'not_allowed'> => {
  if (admission.role !== 'organiser') {
    return Result.failure('not_allowed')
  }

  store.erase()

  return Result.success()
}

/** An event id is drawn at random; a clash is retried rather than overwritten. */
const OPEN_ATTEMPTS = 3

/** Opens an event under a fresh id and hands back its organiser's code. */
export const createEvent = async ({
  drawCode,
  input,
  rooms
}: {
  drawCode: DrawCode
  input: CreateEventInput
  rooms: EventRooms
}): Promise<Result<CreatedEvent, 'invalid_programme' | 'no_free_event_id'>> => {
  if (checkEventSetup(initialSetupOf(input)).status === 'failure') {
    return Result.failure('invalid_programme')
  }

  for (let attempt = 0; attempt < OPEN_ATTEMPTS; attempt++) {
    const eventId = newEventId(drawCode)
    const organiserCode = newOrganiserCode(drawCode)
    const opened = await rooms.open(eventId, input, organiserCode)

    if (opened.status === 'success') {
      return Result.success({ eventId, organiserCode })
    }
  }

  return Result.failure('no_free_event_id')
}
