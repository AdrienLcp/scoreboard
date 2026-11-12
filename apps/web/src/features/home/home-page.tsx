import type React from 'react'
import { lazy, Suspense, useState } from 'react'

import type { DirectoryClub } from '@scoreboard/protocol/club-record'

import { useClub } from '@/features/club/use-club'
import { paths } from '@/infrastructure/router/navigation'
import {
  type OrganisedEvent,
  readOrganisedEvents
} from '@/infrastructure/storage/organised-events-storage'
import { BrandMark } from '@/presentation/components/brand-mark'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink } from '@/presentation/components/link'
import { Main } from '@/presentation/components/main'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { FirstRun } from './first-run'
import { HallScreenSection } from './hall-screen-section'
import { homeDocumentTitle } from './home-document-title'
import { JoinEventForm } from './join-event-form'

import './home-page.sass'

/** A first visit downloads nothing of a club it does not have yet. */
const ClubHome = lazy(async () => ({
  default: (await import('./club-home')).ClubHome
}))

/** A device that organised an event before it had a club still lists it. */
const OrganisedEvents = lazy(async () => ({
  default: (await import('./organised-events')).OrganisedEvents
}))

const organisedEventsOrNone = (): OrganisedEvent[] => {
  const stored = readOrganisedEvents()

  return stored.status === 'success' ? stored.data : []
}

/**
 * The club's own name and logo heading its home, over the hall's seven
 * stripes; the app's mark until a club is here, when the TV's way lives in
 * the side column instead.
 */
const HomeBar: React.FC<{
  club: DirectoryClub | null
  hasScreenLink: boolean
}> = ({ club, hasScreenLink }) => {
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
        <div className='home-bar-actions'>
          <ButtonLink
            aria-label={translate('home.guide')}
            href={paths.guide}
            variant='quiet'
          >
            <Icon name='guide' />
            <span className='home-bar-label'>{translate('home.guide')}</span>
          </ButtonLink>
          {hasScreenLink ? (
            <ButtonLink
              aria-label={translate('home.display')}
              href={paths.wall}
              variant='quiet'
            >
              <Icon name='display' />
              <span className='home-bar-label'>
                {translate('home.display')}
              </span>
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </header>
  )
}

/**
 * Home is the club, see `ClubHome`; a device with no club sees the hall's TV
 * on a fictional day and starts by naming one. Anyone can still join an event
 * by its code.
 */
export const HomePage: React.FC = () => {
  const translate = useTranslate()
  const club = useClub()
  const { state } = club
  const [organisedEvents] = useState(organisedEventsOrNone)
  const isFirstVisit = state.status === 'none'

  return (
    <Main className='home-page'>
      <DocumentTitle>{homeDocumentTitle(translate)}</DocumentTitle>
      <HomeBar
        club={state.status === 'ready' ? state.record.own : null}
        hasScreenLink={!isFirstVisit}
      />
      {state.status === 'none' ? (
        <div className='home-layout'>
          <div className='home-lead'>
            <FirstRun onCreate={club.create} onJoin={club.join} />
          </div>
          <div className='home-side'>
            {organisedEvents.length > 0 ? (
              <Suspense fallback={null}>
                <OrganisedEvents
                  canCreate
                  events={organisedEvents}
                  record={null}
                />
              </Suspense>
            ) : null}
            <JoinEventForm />
            <HallScreenSection />
          </div>
        </div>
      ) : (
        <Suspense
          fallback={
            <div className='home-layout'>
              <div className='home-lead'>
                <p className='home-summary'>{translate('club.loading')}</p>
              </div>
            </div>
          }
        >
          <ClubHome
            onJoin={club.join}
            organisedEvents={organisedEvents}
            state={state}
          />
        </Suspense>
      )}
    </Main>
  )
}
