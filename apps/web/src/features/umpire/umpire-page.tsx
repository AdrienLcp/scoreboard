import type React from 'react'

import type { EventId, UmpireCode } from '@scoreboard/protocol/identifiers'
import { sides } from '@scoreboard/protocol/side'

import { participantNames } from '@/features/event/participant-names'
import {
  useEventIdParam,
  useUmpireCodeParam
} from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { Main } from '@/presentation/components/main'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import {
  protocolErrorKey,
  recordRefusalKey,
  socketStatusKey
} from '@/presentation/i18n/translation'

import { useUmpireConsole } from './use-umpire-console'

const UmpireConsole: React.FC<{ code: UmpireCode; eventId: EventId }> = ({
  code,
  eventId
}) => {
  const translate = useTranslate()
  const umpire = useUmpireConsole({ code, eventId })
  const { match, snapshot, state } = umpire

  const sideName = (side: 'home' | 'away'): string =>
    match === null || snapshot === null
      ? ''
      : participantNames(snapshot.event.players, match[side]).join(' / ') ||
        translate('match.unnamedSide')

  return (
    <Main>
      <title>{translate('umpire.title')}</title>
      <h1>
        {snapshot === null
          ? translate('umpire.title')
          : translate('table.name', { number: snapshot.table })}
      </h1>
      <p>{translate(socketStatusKey(umpire.status))}</p>
      {umpire.pendingCount === 0 ? null : (
        <p>{translate('umpire.pending', { count: umpire.pendingCount })}</p>
      )}
      {umpire.error === null ? null : (
        <p role='alert'>{translate(protocolErrorKey(umpire.error.code))}</p>
      )}
      {umpire.refusal === null ? null : (
        <p role='alert'>{translate(recordRefusalKey(umpire.refusal))}</p>
      )}

      {match === null || state === null ? (
        <p>{translate('table.free')}</p>
      ) : (
        <section>
          <h2>
            {sideName('home')} — {sideName('away')}
          </h2>
          <p>{translate(`match.status.${state.status}`)}</p>

          {state.status === 'scheduled' ? (
            <fieldset>
              <legend>{translate('umpire.firstServer')}</legend>
              {sides.map((side) => (
                <Button key={side} onPress={() => umpire.start(side)}>
                  {sideName(side)}
                </Button>
              ))}
            </fieldset>
          ) : (
            <>
              <p>
                {translate('umpire.games', {
                  away: state.periodsWon.away,
                  home: state.periodsWon.home
                })}
              </p>
              {state.current === null ? null : (
                <p>
                  {state.current.home} – {state.current.away}
                </p>
              )}
              {state.serving === null ? null : (
                <p>
                  {translate('umpire.serving', {
                    name: sideName(state.serving)
                  })}
                </p>
              )}
              {state.status === 'live'
                ? sides.map((side) => (
                    <Button key={side} onPress={() => umpire.score(side)}>
                      {translate('umpire.point', { name: sideName(side) })}
                    </Button>
                  ))
                : null}
              <Button isDisabled={!state.canUndo} onPress={umpire.undo}>
                {translate('umpire.undo')}
              </Button>
              {state.status === 'live'
                ? sides.map((side) => (
                    <Button
                      key={side}
                      onPress={() =>
                        umpire.concede({ by: side, reason: 'retirement' })
                      }
                    >
                      {translate('umpire.retire', { name: sideName(side) })}
                    </Button>
                  ))
                : null}
            </>
          )}
        </section>
      )}
    </Main>
  )
}

/** One table's console: an umpire scores the match on it, point by point. */
export const UmpirePage: React.FC = () => {
  const translate = useTranslate()
  const eventId = useEventIdParam()
  const code = useUmpireCodeParam()

  if (eventId === null || code === null) {
    return (
      <Main>
        <title>{translate('umpire.title')}</title>
        <p>{translate('error.wrong_code')}</p>
      </Main>
    )
  }

  return <UmpireConsole code={code} eventId={eventId} />
}
