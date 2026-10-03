import type React from 'react'

import type { EventId } from '@scoreboard/protocol/identifiers'

import { MatchLine } from '@/features/event/match-line'
import { useEventIdParam } from '@/infrastructure/router/navigation'
import { Main } from '@/presentation/components/main'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import {
  protocolErrorKey,
  socketStatusKey
} from '@/presentation/i18n/translation'

import { useDisplayFeed } from './use-display-feed'

const DisplayBoard: React.FC<{ eventId: EventId }> = ({ eventId }) => {
  const translate = useTranslate()
  const { error, snapshot, status } = useDisplayFeed(eventId)

  if (snapshot === null) {
    return (
      <Main>
        <title>{translate('display.title')}</title>
        <p>{translate(socketStatusKey(status))}</p>
        {error === null ? null : (
          <p>{translate(protocolErrorKey(error.code))}</p>
        )}
      </Main>
    )
  }

  return (
    <Main>
      <title>{snapshot.name}</title>
      <h1>{snapshot.club?.name ?? snapshot.name}</h1>
      <p>{translate(socketStatusKey(status))}</p>
      <ol>
        {snapshot.tables.map((table) => {
          const match = snapshot.matches.find(
            (candidate) => candidate.id === table.matchId
          )

          return (
            <li key={table.number}>
              <h2>{translate('table.name', { number: table.number })}</h2>
              {match === undefined ? (
                <p>{translate('table.free')}</p>
              ) : (
                <MatchLine match={match} players={snapshot.players} />
              )}
            </li>
          )
        })}
      </ol>
    </Main>
  )
}

/** The big screen: every table and its match, live. */
export const DisplayPage: React.FC = () => {
  const translate = useTranslate()
  const eventId = useEventIdParam()

  if (eventId === null) {
    return (
      <Main>
        <title>{translate('display.title')}</title>
        <p>{translate('error.event_not_found')}</p>
      </Main>
    )
  }

  return <DisplayBoard eventId={eventId} />
}
