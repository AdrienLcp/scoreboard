import type React from 'react'
import { useState } from 'react'

import type { ClubRecord } from '@scoreboard/protocol/club-record'

import { organiserPathFor } from '@/infrastructure/router/navigation'
import type { OrganisedEvent } from '@/infrastructure/storage/organised-events-storage'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { Link } from '@/presentation/components/link'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { NewEventForm } from './new-event-form'

const SHOWN_ORGANISED_EVENTS = 5

type OrganisedEventsProps = {
  /** `false` while the page's headline already holds the new event's form. */
  canCreate: boolean
  events: readonly OrganisedEvent[]
  record: ClubRecord | null
}

/** The events this device organises, latest first, and a new one opened by its name alone. */
export const OrganisedEvents: React.FC<OrganisedEventsProps> = ({
  canCreate,
  events,
  record
}) => {
  const translate = useTranslate()
  const [isCreating, setIsCreating] = useState(false)

  if (events.length === 0 && !canCreate) {
    return null
  }

  return (
    <section aria-labelledby='home-events-title' className='home-block'>
      <h2 id='home-events-title'>{translate('home.events.title')}</h2>
      {events.length === 0 ? (
        <p className='home-hint'>{translate('home.events.empty')}</p>
      ) : (
        <ul className='home-rows'>
          {events.slice(0, SHOWN_ORGANISED_EVENTS).map((event) => (
            <li key={event.eventId}>
              <Link className='home-row' href={organiserPathFor(event.eventId)}>
                <span className='home-row-main'>
                  <b>{event.name}</b>
                </span>
                <Icon name='arrowRight' />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!canCreate ? null : isCreating ? (
        <NewEventForm autoFocus record={record} />
      ) : (
        <Button
          className='home-block-action'
          onPress={() => setIsCreating(true)}
        >
          <Icon name='plus' />
          {translate('home.events.newEvent')}
        </Button>
      )}
    </section>
  )
}
