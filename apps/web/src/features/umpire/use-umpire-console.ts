import { useEffect, useState } from 'react'

import type { Credentials } from '@scoreboard/protocol/client-message'
import type { RecordRefusal } from '@scoreboard/protocol/error-code'
import type { UmpireSnapshot } from '@scoreboard/protocol/event-snapshot'
import type { EventId, UmpireCode } from '@scoreboard/protocol/identifiers'
import type {
  ConcessionReason,
  ScoringEvent
} from '@scoreboard/protocol/scoring-event'
import type { Side } from '@scoreboard/protocol/side'

import { describeMatch } from '@scoreboard/core/match/match-log'

import { newId } from '@/infrastructure/ids'
import {
  enqueue,
  type Outbox,
  pendingEventsFor,
  settle
} from '@/infrastructure/messaging/outbox'
import { useEventSocket } from '@/infrastructure/messaging/use-event-socket'
import {
  readOutbox,
  writeOutbox
} from '@/infrastructure/storage/outbox-storage'

type Seat = { code: UmpireCode; eventId: EventId }

/** A console that cannot read its saved points starts with none rather than not at all. */
const readOutboxOrEmpty = (seat: Seat): Outbox => {
  const stored = readOutbox(seat)

  if (stored.status === 'failure') {
    console.warn(`Pending points unreadable: ${stored.error}`)

    return []
  }

  return stored.data ?? []
}

/**
 * The umpire's table: the match on it, scored optimistically. Every event goes
 * to an outbox kept on the device first, then to the server; the outbox is
 * replayed after every reconnection until the server confirms each event.
 */
export const useUmpireConsole = ({ code, eventId }: Seat) => {
  const [snapshot, setSnapshot] = useState<UmpireSnapshot | null>(null)
  const [outbox, setOutbox] = useState<Outbox>(() =>
    readOutboxOrEmpty({ code, eventId })
  )
  const [refusal, setRefusal] = useState<RecordRefusal | null>(null)
  const credentials: Credentials = { code, role: 'umpire' }

  useEffect(() => {
    const written = writeOutbox({ code, eventId, outbox })

    if (written.status === 'failure') {
      console.warn(`Pending points not saved: ${written.error}`)
    }
  }, [code, eventId, outbox])

  const socket = useEventSocket({
    credentials,
    eventId,
    onMessage: (message) => {
      switch (message.type) {
        case 'snapshot.umpire':
          setSnapshot(message.snapshot)
          break
        case 'record.accepted':
          setOutbox((current) => settle(current, message.eventId))
          break
        case 'record.refused':
          setOutbox((current) => settle(current, message.eventId))
          setRefusal(message.reason)
          break
        default:
          break
      }
    },
    onOpen: (send) => {
      for (const record of outbox) {
        send({ ...record, type: 'match.record' })
      }
    }
  })

  const matchId =
    snapshot?.event.tables.find((table) => table.number === snapshot.table)
      ?.matchId ?? null
  const match =
    snapshot?.event.matches.find((candidate) => candidate.id === matchId) ??
    null
  const state =
    match === null || snapshot === null
      ? null
      : describeMatch(match.format, [
          ...snapshot.log,
          ...pendingEventsFor(outbox, match.id)
        ])

  const record = (event: ScoringEvent): void => {
    if (match === null) {
      return
    }

    setRefusal(null)
    setOutbox((current) => enqueue(current, { event, matchId: match.id }))
    socket.send({ event, matchId: match.id, type: 'match.record' })
  }

  return {
    concede: ({ by, reason }: { by: Side; reason: ConcessionReason }) => {
      record({ by, id: newId(), reason, type: 'match.conceded' })
    },
    error: socket.error,
    match,
    pendingCount: outbox.length,
    refusal,
    score: (side: Side) => {
      record({ id: newId(), side, type: 'point.scored' })
    },
    snapshot,
    start: (firstServer: Side) => {
      record({ firstServer, id: newId(), type: 'match.started' })
    },
    state,
    status: socket.status,
    undo: () => {
      record({ id: newId(), type: 'score.undone' })
    }
  }
}
