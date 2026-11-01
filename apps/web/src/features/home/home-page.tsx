import type React from 'react'
import { useState } from 'react'

import type { DirectoryClub } from '@scoreboard/protocol/club-record'

import { useClub } from '@/features/club/use-club'
import { nowMs } from '@/infrastructure/clock'
import { toLocalDay } from '@/infrastructure/dates'
import { paths } from '@/infrastructure/router/navigation'
import {
  type OrganisedEvent,
  readOrganisedEvents
} from '@/infrastructure/storage/organised-events-storage'
import { BrandMark } from '@/presentation/components/brand-mark'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink } from '@/presentation/components/link'
import { Main } from '@/presentation/components/main'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { clubRoundOf } from './club-day'
import { ClubRoundSection } from './club-round'
import { ClubSeason } from './club-season'
import { FirstRun } from './first-run'
import { FreeDaySection } from './free-day'
import { homeDocumentTitle } from './home-document-title'
import { JoinEventForm } from './join-event-form'
import { OrganisedEvents } from './organised-events'

import './home-page.sass'

const organisedEventsOrNone = (): OrganisedEvent[] => {
  const stored = readOrganisedEvents()

  return stored.status === 'success' ? stored.data : []
}

/** The club's own name and logo heading its home, over the hall's seven stripes; the app's mark until a club is here. */
const HomeBar: React.FC<{ club: DirectoryClub | null }> = ({ club }) => {
  const translate = useTranslate()

  return (
    <header className='home-bar' data-club={club === null ? undefined : true}>
      <div className='home-bar-in'>
        {club === null ? (
          <BrandMark />
        ) : (
          <span className='home-club'>
            {club.logoUrl === null ? null : (
              <img alt='' className='home-club-logo' src={club.logoUrl} />
            )}
            <span className='home-club-name'>{club.name}</span>
          </span>
        )}
        <ButtonLink href={paths.wall} variant='quiet'>
          <Icon name='display' />
          {translate('home.display')}
        </ButtonLink>
      </div>
    </header>
  )
}

/**
 * Home is the club: its next championship round ready to prepare or pick up
 * again, the events this device organises, and the season's teams, pools
 * and directory; a device with no club starts by naming one. Anyone can
 * still join an event by its code.
 */
export const HomePage: React.FC = () => {
  const translate = useTranslate()
  const club = useClub()
  const { state } = club
  const [organisedEvents] = useState(organisedEventsOrNone)
  const record = state.status === 'ready' ? state.record : null
  const round =
    record === null ? null : clubRoundOf(record, toLocalDay(nowMs()))

  return (
    <Main className='home-page'>
      <DocumentTitle>{homeDocumentTitle(translate)}</DocumentTitle>
      <HomeBar club={record?.own ?? null} />
      <div className='home-layout'>
        <div className='home-lead'>
          {state.status === 'none' ? (
            <FirstRun onCreate={club.create} onJoin={club.join} />
          ) : null}
          {state.status === 'loading' ? (
            <p className='home-summary'>{translate('club.loading')}</p>
          ) : null}
          {state.status === 'missing' || state.status === 'offline' ? (
            <div className='home-unreachable'>
              <p className='home-alert' role='alert'>
                <Icon name={state.status === 'offline' ? 'wifiOff' : 'alert'} />
                {translate(
                  state.status === 'offline' ? 'club.offline' : 'club.missing'
                )}
              </p>
              <div className='home-unreachable-actions'>
                <Button onPress={() => club.join(state.code)}>
                  <Icon name='sync' />
                  {translate('club.retry')}
                </Button>
                <ButtonLink href={paths.club} variant='quiet'>
                  <Icon name='club' />
                  {translate('club.title')}
                </ButtonLink>
              </div>
            </div>
          ) : null}
          {state.status === 'ready' && round !== null ? (
            <ClubRoundSection
              organisedEventIds={organisedEvents.map((event) => event.eventId)}
              record={state.record}
              round={round}
            />
          ) : null}
          {state.status === 'ready' && round === null ? (
            <FreeDaySection record={state.record} />
          ) : null}
        </div>
        <div className='home-side'>
          <OrganisedEvents
            canCreate={!(state.status === 'ready' && round === null)}
            events={organisedEvents}
            record={record}
          />
          {state.status === 'ready' ? (
            <ClubSeason code={state.code} record={state.record} />
          ) : null}
          <JoinEventForm />
        </div>
      </div>
    </Main>
  )
}
