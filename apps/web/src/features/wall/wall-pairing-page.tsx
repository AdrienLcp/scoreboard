import type React from 'react'
import { useEffect, useState } from 'react'

import {
  organiserPairingPathFor,
  useReplaceWith,
  useWallPairingCodeParam
} from '@/infrastructure/router/navigation'
import { readOrganisedEvents } from '@/infrastructure/storage/organised-events-storage'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink } from '@/presentation/components/link'
import { MessagePage } from '@/presentation/components/message-page'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import './wall-pairing-page.sass'

const organisedEventsOrNone = () => {
  const stored = readOrganisedEvents()

  return stored.status === 'success' ? stored.data : []
}

/**
 * Where the organiser's phone lands after scanning a waiting screen: straight
 * into the console of the one event it organises, or a choice between them.
 */
export const WallPairingPage: React.FC = () => {
  const translate = useTranslate()
  const replaceWith = useReplaceWith()
  const pairingCode = useWallPairingCodeParam()
  const [events] = useState(organisedEventsOrNone)
  const onlyEvent = events.length === 1 ? events[0] : undefined

  useEffect(() => {
    if (pairingCode !== null && onlyEvent !== undefined) {
      replaceWith(
        organiserPairingPathFor({ eventId: onlyEvent.eventId, pairingCode })
      )
    }
  }, [onlyEvent, pairingCode, replaceWith])

  if (pairingCode === null) {
    return (
      <MessagePage
        detail={translate('wallPairing.invalid')}
        title={translate('wallPairing.title')}
      >
        {null}
      </MessagePage>
    )
  }

  if (events.length === 0) {
    return (
      <MessagePage
        detail={translate('wallPairing.none.detail')}
        title={translate('wallPairing.title')}
      >
        <ul className='wall-pairing-ways'>
          <li>
            <Icon name='phone' />
            <p>{translate('wallPairing.none.scan')}</p>
          </li>
          <li>
            <Icon name='keyboard' />
            <p>
              {translate('wallPairing.none.type')}{' '}
              <strong translate='no'>{pairingCode}</strong>
            </p>
          </li>
        </ul>
      </MessagePage>
    )
  }

  return (
    <MessagePage
      detail={translate('wallPairing.choose', { code: pairingCode })}
      title={translate('wallPairing.title')}
    >
      <ul className='wall-pairing-events'>
        {events.map((event) => (
          <li key={event.eventId}>
            <ButtonLink
              href={organiserPairingPathFor({
                eventId: event.eventId,
                pairingCode
              })}
            >
              <Icon name='display' />
              {event.name}
            </ButtonLink>
          </li>
        ))}
      </ul>
    </MessagePage>
  )
}
