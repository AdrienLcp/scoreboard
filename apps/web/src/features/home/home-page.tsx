import type React from 'react'
import { useState } from 'react'

import { eventIdSchema } from '@scoreboard/protocol/identifiers'

import { defaultPlanOf } from '@/features/club/club-edits'
import { useClub } from '@/features/club/use-club'
import {
  organiserPathFor,
  paths,
  spectatorPathFor,
  umpireEntryPathFor,
  useNavigateTo
} from '@/infrastructure/router/navigation'
import {
  type OrganisedEvent,
  readOrganisedEvents
} from '@/infrastructure/storage/organised-events-storage'
import { BrandMark } from '@/presentation/components/brand-mark'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink } from '@/presentation/components/link'
import { Main } from '@/presentation/components/main'
import {
  Description,
  FieldError,
  Input,
  Label,
  TextField
} from '@/presentation/components/text-field'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-context'
import { apiErrorKey } from '@/presentation/i18n/translation'

import { homeDocumentTitle } from './home-document-title'
import { useCreateEvent } from './use-create-event'

import './home-page.sass'

/** The club's own hall, until it keeps a plan: tables are added or put away in the event's plan. */
const DEFAULT_TABLE_COUNT = 8
/** Three games to win, the federation's usual match; each match can be set otherwise in the programme. */
const DEFAULT_BEST_OF = 5
const POINTS_PER_GAME = 11
const SHOWN_ORGANISED_EVENTS = 4

/** An event link pasted whole works as well as its code alone. */
const eventCodeIn = (typed: string): string =>
  typed.trim().split('/e/').at(-1)?.split(/[/?#]/)[0]?.toLowerCase() ?? ''

/** A device that prepares a club's days opens each one with the club's name, logo and hall. */
const CreateEventForm: React.FC = () => {
  const translate = useTranslate()
  const { create, state } = useCreateEvent()
  const { state: club } = useClub()
  const record = club.status === 'ready' ? club.record : null
  const clubHall = record === null ? null : defaultPlanOf(record)
  const [name, setName] = useState('')
  const tableCount = clubHall?.tables.length ?? DEFAULT_TABLE_COUNT

  return (
    <Form
      className='home-card home-create'
      onSubmit={(event) => {
        event.preventDefault()
        void create({
          club:
            record === null
              ? null
              : {
                  colours: null,
                  logoUrl: record.own.logoUrl,
                  name: record.own.name
                },
          format: {
            bestOf: DEFAULT_BEST_OF,
            pointsPerGame: POINTS_PER_GAME,
            sport: 'table-tennis'
          },
          hall: clubHall,
          name,
          tableCount
        })
      }}
    >
      <h2>{translate('home.title')}</h2>
      <TextField isRequired onChange={setName} value={name}>
        <Label>{translate('home.name')}</Label>
        <Input placeholder={translate('home.namePlaceholder')} />
      </TextField>
      <Button
        isDisabled={state.status === 'creating'}
        type='submit'
        variant='primary'
      >
        {translate(
          state.status === 'creating' ? 'home.creating' : 'home.create'
        )}
      </Button>
      {state.status === 'failed' ? (
        <p className='home-error' role='alert'>
          <Icon name='alert' />
          {translate(apiErrorKey(state.error))}
        </p>
      ) : (
        <p className='home-note'>{translate('home.createNote')}</p>
      )}
    </Form>
  )
}

const JoinEventForm: React.FC = () => {
  const translate = useTranslate()
  const navigateTo = useNavigateTo()
  const [typed, setTyped] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const eventId = eventIdSchema.safeParse(eventCodeIn(typed))
  const goTo = (pathFor: (id: string) => string) => {
    setIsSubmitted(true)

    if (eventId.success) {
      navigateTo(pathFor(eventId.data))
    }
  }

  return (
    <Form
      className='home-card home-join'
      onSubmit={(event) => {
        event.preventDefault()
        goTo(spectatorPathFor)
      }}
    >
      <h2>{translate('home.join.title')}</h2>
      <TextField
        isInvalid={isSubmitted && !eventId.success}
        onChange={(value) => {
          setTyped(value)
          setIsSubmitted(false)
        }}
        value={typed}
      >
        <Label>{translate('home.join.code')}</Label>
        <Input
          autoComplete='off'
          className='home-join-input'
          spellCheck={false}
        />
        <Description>{translate('home.join.hint')}</Description>
        <FieldError>
          <Icon name='alert' />
          {translate('home.join.invalid')}
        </FieldError>
      </TextField>
      <div className='home-join-actions'>
        <Button type='submit'>{translate('home.join.follow')}</Button>
        <Button onPress={() => goTo(umpireEntryPathFor)}>
          {translate('home.join.umpire')}
        </Button>
      </div>
    </Form>
  )
}

/** The events this device organises, latest first: closing the tab or leaving for the club page never loses one. */
const OrganisedEvents: React.FC<{ events: OrganisedEvent[] }> = ({
  events
}) => {
  const translate = useTranslate()

  return (
    <section className='home-card home-resume'>
      <h2>{translate('home.resume')}</h2>
      <ul className='home-resume-list'>
        {events.slice(0, SHOWN_ORGANISED_EVENTS).map((event) => (
          <li key={event.eventId}>
            <ButtonLink href={organiserPathFor(event.eventId)}>
              <span className='home-resume-name'>{event.name}</span>
              <Icon name='arrowRight' />
            </ButtonLink>
          </li>
        ))}
      </ul>
    </section>
  )
}

const organisedEventsOrNone = (): OrganisedEvent[] => {
  const stored = readOrganisedEvents()

  return stored.status === 'success' ? stored.data : []
}

/** The way in: open a new event, pick one up again, or join one by its code. */
export const HomePage: React.FC = () => {
  const translate = useTranslate()
  const [organisedEvents] = useState(organisedEventsOrNone)

  return (
    <Main className='home-page'>
      <DocumentTitle>{homeDocumentTitle(translate)}</DocumentTitle>
      <header className='home-bar'>
        <BrandMark />
        <nav className='home-bar-links'>
          <ButtonLink href={paths.wall} variant='quiet'>
            <Icon name='display' />
            {translate('home.display')}
          </ButtonLink>
          <ButtonLink href={paths.club} variant='quiet'>
            <Icon name='club' />
            {translate('home.club')}
          </ButtonLink>
        </nav>
      </header>
      <div className='home-intro'>
        <h1>{translate('home.headline')}</h1>
        <p>{translate('home.lead')}</p>
      </div>
      {organisedEvents.length === 0 ? null : (
        <OrganisedEvents events={organisedEvents} />
      )}
      <div className='home-forms'>
        <CreateEventForm />
        <JoinEventForm />
      </div>
    </Main>
  )
}
