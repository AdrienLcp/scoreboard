import type React from 'react'
import { useEffect, useState } from 'react'

import type { EventId, OrganiserCode } from '@scoreboard/protocol/identifiers'

import { isEventGone } from '@/features/event/event-gone'
import { FeedMessage } from '@/features/event/feed-message'
import { useCurrentSnapshot } from '@/features/event/use-current-snapshot'
import {
  type ConsoleStep,
  organiserConnectPathFor,
  organiserStepPathFor,
  paths,
  useConsoleStepParam,
  useNavigateTo
} from '@/infrastructure/router/navigation'
import {
  forgetOrganisedEvent,
  rememberOrganisedEvent
} from '@/infrastructure/storage/organised-events-storage'
import { forgetOrganiserCode } from '@/infrastructure/storage/organiser-code-storage'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink } from '@/presentation/components/link'
import { Main } from '@/presentation/components/main'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-context'
import {
  recordRefusalKey,
  setupRefusalKey,
  socketStatusKey
} from '@/presentation/i18n/translation'

import { ConsoleStepBar } from './console-step-bar'
import { firstStepOf } from './console-steps'
import { EncountersStep } from './encounters-step'
import { type EventFormat, eventFormatOf } from './event-format'
import { HallStep } from './hall-step'
import { LiveStep } from './live-step'
import { SettingsStep } from './settings-step'
import { useOrganiserConsole } from './use-organiser-console'
import { useSheetResults } from './use-sheet-results'

import './organiser-page.sass'

/**
 * The organiser's console: the day in three steps (the hall, the encounters,
 * the live day) with the settings aside, every one reachable at any time.
 */
export const OrganiserConsole: React.FC<{
  code: OrganiserCode
  eventId: EventId
}> = ({ code, eventId }) => {
  const translate = useTranslate()
  const organiser = useOrganiserConsole({ code, eventId })
  const { snapshot } = organiser
  const { snapshot: event } = useCurrentSnapshot(snapshot?.event ?? null)
  useSheetResults({ event, eventId })
  const isGone = isEventGone(organiser.error)
  const askedStep = useConsoleStepParam()
  const [chosenFormat, setChosenFormat] = useState<EventFormat | null>(null)
  const navigateTo = useNavigateTo()
  const eventName = snapshot?.setup.name ?? null

  useEffect(() => {
    if (isGone) {
      forgetOrganiserCode(eventId)
      forgetOrganisedEvent(eventId)
    }
  }, [eventId, isGone])

  useEffect(() => {
    if (eventName !== null) {
      rememberOrganisedEvent({ eventId, name: eventName })
    }
  }, [eventId, eventName])

  if (snapshot === null || event === null || isGone) {
    return (
      <FeedMessage
        error={organiser.error}
        status={organiser.status}
        title={translate('organiser.title')}
      />
    )
  }

  const { setup } = snapshot
  const step: ConsoleStep = askedStep ?? firstStepOf(event)
  const format = chosenFormat ?? eventFormatOf(setup)
  const refusal =
    organiser.setupRefusal === null
      ? organiser.recordRefusal === null
        ? null
        : translate(recordRefusalKey(organiser.recordRefusal))
      : translate(setupRefusalKey(organiser.setupRefusal))
  const isOnline = organiser.status === 'open'

  return (
    <Main className='organiser-page'>
      <DocumentTitle>{`${translate('organiser.title')} — ${setup.name}`}</DocumentTitle>
      <header className='organiser-bar'>
        <ButtonLink
          className='organiser-back'
          href={paths.home}
          variant='quiet'
        >
          <Icon name='arrowLeft' />
          <span>{setup.club?.name ?? translate('organiser.steps.home')}</span>
        </ButtonLink>
        <div className='organiser-title'>
          <h1>{setup.name}</h1>
          <p>
            {format === null ? null : (
              <span>{translate(`organiser.steps.format.${format}`)}</span>
            )}
            {isOnline ? null : (
              <span className='organiser-status'>
                <Icon name='wifiOff' />
                {translate(socketStatusKey(organiser.status))}
              </span>
            )}
          </p>
        </div>
        <div className='organiser-links'>
          <ButtonLink href={organiserConnectPathFor(eventId)}>
            <Icon name='display' />
            <span>{translate('organiser.access.display')}</span>
          </ButtonLink>
          <ButtonLink
            aria-current={step === 'settings' ? 'page' : undefined}
            href={organiserStepPathFor({ eventId, step: 'settings' })}
            variant='quiet'
          >
            <Icon name='settings' />
            <span>{translate('organiser.steps.settings')}</span>
          </ButtonLink>
        </div>
      </header>
      {refusal === null ? null : (
        <p className='organiser-alert' role='alert'>
          <Icon name='alert' />
          {refusal}
        </p>
      )}
      {step === 'settings' ? null : (
        <ConsoleStepBar
          chosenFormat={chosenFormat}
          connectedScreens={
            snapshot.connectedScreens.filter((screen) => screen.tvCount > 0)
              .length
          }
          current={step}
          event={event}
          eventId={eventId}
          setup={setup}
        />
      )}
      {step === 'hall' ? (
        <HallStep
          accesses={snapshot.tableAccesses}
          code={code}
          connectedScreens={snapshot.connectedScreens}
          event={event}
          eventId={eventId}
          onRecord={organiser.record}
          onSave={organiser.saveSetup}
          setup={setup}
        />
      ) : null}
      {step === 'encounters' ? (
        <EncountersStep
          chosenFormat={chosenFormat}
          event={event}
          eventId={eventId}
          onChooseFormat={setChosenFormat}
          onNext={() =>
            navigateTo(organiserStepPathFor({ eventId, step: 'live' }))
          }
          onRecord={organiser.record}
          onSave={organiser.saveSetup}
          setup={setup}
        />
      ) : null}
      {step === 'live' ? (
        <LiveStep
          accesses={snapshot.tableAccesses}
          event={event}
          eventId={eventId}
          onRecord={organiser.record}
          onSave={organiser.saveSetup}
          setup={setup}
        />
      ) : null}
      {step === 'settings' ? (
        <SettingsStep
          accesses={snapshot.tableAccesses}
          code={code}
          event={event}
          eventId={eventId}
          onDelete={organiser.deleteEvent}
          onRecord={organiser.record}
          onSave={organiser.saveSetup}
          setup={setup}
        />
      ) : null}
    </Main>
  )
}
