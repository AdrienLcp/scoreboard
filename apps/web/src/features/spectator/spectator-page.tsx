import type React from 'react'

import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { EventId } from '@scoreboard/protocol/identifiers'

import { spectatorProgrammeFor } from '@scoreboard/core/event/spectator-programme'

import { MatchLine } from '@/features/event/match-line'
import { usePublicFeed } from '@/features/event/use-public-feed'
import { useEventIdParam } from '@/infrastructure/router/navigation'
import { Main } from '@/presentation/components/main'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import {
  protocolErrorKey,
  socketStatusKey
} from '@/presentation/i18n/translation'

type ProgrammeSection = 'live' | 'upcoming' | 'finished'

const SECTIONS: readonly ProgrammeSection[] = ['live', 'upcoming', 'finished']

const SpectatorProgramme: React.FC<{ eventId: EventId }> = ({ eventId }) => {
  const translate = useTranslate()
  const { error, snapshot, status } = usePublicFeed({
    eventId,
    role: 'spectator'
  })

  if (snapshot === null) {
    return (
      <Main>
        <title>{translate('spectator.title')}</title>
        <p>{translate(socketStatusKey(status))}</p>
        {error === null ? null : (
          <p>{translate(protocolErrorKey(error.code))}</p>
        )}
      </Main>
    )
  }

  const programme = spectatorProgrammeFor(snapshot)
  const tableOf = (match: MatchView): string =>
    match.table === null
      ? ''
      : `${translate('table.name', { number: match.table })} · `

  return (
    <Main>
      <title>{snapshot.name}</title>
      <h1>{snapshot.name}</h1>
      <p>{translate(socketStatusKey(status))}</p>
      {SECTIONS.map((section) => (
        <section key={section}>
          <h2>{translate(`spectator.section.${section}`)}</h2>
          {programme[section].length === 0 ? (
            <p>{translate(`spectator.empty.${section}`)}</p>
          ) : (
            <ol>
              {programme[section].map((match) => (
                <li key={match.id}>
                  {tableOf(match)}
                  <MatchLine match={match} players={snapshot.players} />
                  {match.state.periods.length === 0 ? null : (
                    <p>
                      {match.state.periods
                        .map((period) => `${period.home}-${period.away}`)
                        .join(' · ')}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}
    </Main>
  )
}

/** A visitor's phone: the whole day, read-only, reached from the display's QR code. */
export const SpectatorPage: React.FC = () => {
  const translate = useTranslate()
  const eventId = useEventIdParam()

  if (eventId === null) {
    return (
      <Main>
        <title>{translate('spectator.title')}</title>
        <p>{translate('error.event_not_found')}</p>
      </Main>
    )
  }

  return <SpectatorProgramme eventId={eventId} />
}
