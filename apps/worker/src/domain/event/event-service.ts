import { Result } from '@adrienlcp/result'

import type { Credentials } from '@scoreboard/protocol/client-message'
import type {
  ProtocolErrorCode,
  RecordRefusal,
  SetupRefusal
} from '@scoreboard/protocol/error-code'
import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type { MatchId, OrganiserCode } from '@scoreboard/protocol/identifiers'
import type { CreateEventInput } from '@scoreboard/protocol/routes'
import type {
  InstantMs,
  ScoringEvent
} from '@scoreboard/protocol/scoring-event'

import {
  type DrawCode,
  tableAccessesFor
} from '@scoreboard/core/access/access-codes'
import { checkEventSetup } from '@scoreboard/core/event/event-setup-check'
import { recordScoringEvent } from '@scoreboard/core/match/match-log'

import type { Admission } from './admission'
import type { EventStore } from './event-store'

/** Opens a new event with an empty programme, once. */
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

  store.writeSetup({
    club: null,
    defaultFormat: input.format,
    displays: [],
    encounters: [],
    matches: [],
    name: input.name,
    players: [],
    startsAtMs: null,
    tableCount: input.tableCount,
    teams: []
  })
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
      return Result.success({ role: 'display' })
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

  const match = store
    .readSetup()
    ?.matches.find((candidate) => candidate.id === matchId)

  if (match === undefined) {
    return Result.failure('match_not_found')
  }

  if (admission.role === 'umpire' && match.table !== admission.table) {
    return Result.failure('match_not_on_table')
  }

  const recorded = recordScoringEvent({
    event,
    format: match.format,
    log: (store.readLogs().get(matchId) ?? []).map((stamped) => stamped.event)
  })

  if (recorded.status === 'failure') {
    const refusal = recorded.error

    return refusal === 'duplicate'
      ? Result.success('duplicate')
      : Result.failure(refusal)
  }

  store.appendScoringEvent(matchId, { event, recordedAtMs: nowMs })

  return Result.success('recorded')
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
