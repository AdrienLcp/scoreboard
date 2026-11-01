import type React from 'react'
import { useEffect, useRef, useState } from 'react'

import type { EventId, OrganiserCode } from '@scoreboard/protocol/identifiers'
import { organiserCodeSchema } from '@scoreboard/protocol/identifiers'

import { encounterLinesFor } from '@/features/event/encounter-lines'
import { EncounterScore } from '@/features/event/encounter-score'
import { isEventGone } from '@/features/event/event-gone'
import { FeedMessage } from '@/features/event/feed-message'
import { useCurrentSnapshot } from '@/features/event/use-current-snapshot'
import {
  displayPathFor,
  paths,
  spectatorPathFor,
  useEventIdParam,
  usePairingSearchParam
} from '@/infrastructure/router/navigation'
import {
  forgetOrganisedEvent,
  rememberOrganisedEvent
} from '@/infrastructure/storage/organised-events-storage'
import {
  forgetOrganiserCode,
  readOrganiserCode,
  writeOrganiserCode
} from '@/infrastructure/storage/organiser-code-storage'
import { BrandMark } from '@/presentation/components/brand-mark'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink } from '@/presentation/components/link'
import { Main } from '@/presentation/components/main'
import {
  keepSelectedTabInView,
  Tab,
  TabList,
  TabPanel,
  Tabs
} from '@/presentation/components/tabs'
import { Input, Label, TextField } from '@/presentation/components/text-field'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-context'
import {
  recordRefusalKey,
  setupRefusalKey,
  socketStatusKey
} from '@/presentation/i18n/translation'

import { ClubEncounterForm } from './club-encounter-form'
import { DisplaysEditor } from './displays-editor'
import { EncounterForm } from './encounter-form'
import { EventDeletion } from './event-deletion'
import { EventSettingsForm } from './event-settings-form'
import { HallPlanBoard } from './hall-plan'
import { LiveTables } from './live-tables'
import { MatchesEditor } from './matches-editor'
import { PlayerForfeit } from './player-forfeit'
import { PlayersEditor } from './players-editor'
import { TableAccesses } from './table-accesses'
import { TournamentEditor } from './tournament-editor'
import { useOrganiserConsole } from './use-organiser-console'
import { WallPairingForm } from './wall-pairing-form'

import './organiser-page.sass'

type OrganiserTab =
  | 'live'
  | 'plan'
  | 'matches'
  | 'players'
  | 'encounters'
  | 'tournament'
  | 'tables'
  | 'settings'

const TABS: readonly OrganiserTab[] = [
  'live',
  'plan',
  'matches',
  'players',
  'encounters',
  'tournament',
  'tables',
  'settings'
]

/** A device that cannot read storage asks for the code, as one that never had it. */
const storedCodeOrNull = (eventId: EventId): OrganiserCode | null => {
  const stored = readOrganiserCode(eventId)

  return stored.status === 'success' ? stored.data : null
}

const OrganiserConsole: React.FC<{ code: OrganiserCode; eventId: EventId }> = ({
  code,
  eventId
}) => {
  const translate = useTranslate()
  const tabBar = useRef<HTMLDivElement>(null)
  const organiser = useOrganiserConsole({ code, eventId })
  const { snapshot } = organiser
  const { snapshot: event } = useCurrentSnapshot(snapshot?.event ?? null)
  const isGone = isEventGone(organiser.error)
  const scannedPairingCode = usePairingSearchParam()
  const eventName = snapshot?.setup.name ?? null

  useEffect(() => {
    if (isGone) {
      forgetOrganiserCode(eventId)
      forgetOrganisedEvent(eventId)
    }
  }, [eventId, isGone])

  useEffect(() => {
    if (eventName !== null && scannedPairingCode !== null) {
      keepSelectedTabInView(tabBar.current)
    }
  }, [eventName, scannedPairingCode])

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
  const refusal =
    organiser.setupRefusal === null
      ? organiser.recordRefusal === null
        ? null
        : translate(recordRefusalKey(organiser.recordRefusal))
      : translate(setupRefusalKey(organiser.setupRefusal))

  return (
    <Main className='organiser-page'>
      <DocumentTitle>{`${translate('organiser.title')} — ${setup.name}`}</DocumentTitle>
      <header className='organiser-bar'>
        <BrandMark />
        <p
          className='organiser-status'
          data-open={organiser.status === 'open' || undefined}
        >
          {organiser.status === 'open' ? (
            <span aria-hidden='true' className='organiser-dot' />
          ) : (
            <Icon name='wifiOff' />
          )}
          {translate(socketStatusKey(organiser.status))}
        </p>
      </header>
      <div className='organiser-head'>
        <div>
          <h1>{setup.name}</h1>
          <p>
            {[
              setup.club?.name ?? null,
              translate('organiser.summary', {
                matches: setup.matches.length,
                tables: setup.tableCount
              })
            ]
              .filter((part) => part !== null)
              .join(' · ')}
          </p>
        </div>
        <div className='organiser-links'>
          <ButtonLink href={paths.club}>
            <Icon name='club' />
            {translate('organiser.club')}
          </ButtonLink>
          <ButtonLink href={displayPathFor(eventId)} target='_blank'>
            <Icon name='display' />
            {translate('organiser.access.display')}
          </ButtonLink>
          <ButtonLink href={spectatorPathFor(eventId)} target='_blank'>
            <Icon name='open' />
            {translate('organiser.access.spectator')}
          </ButtonLink>
        </div>
      </div>
      {refusal === null ? null : (
        <p className='organiser-alert' role='alert'>
          <Icon name='alert' />
          {refusal}
        </p>
      )}
      <Tabs
        className='organiser-tabs'
        defaultSelectedKey={scannedPairingCode === null ? 'live' : 'tables'}
        onSelectionChange={() => keepSelectedTabInView(tabBar.current)}
      >
        <div className='organiser-tab-bar' ref={tabBar}>
          <TabList aria-label={translate('organiser.title')}>
            {TABS.map((tab) => (
              <Tab id={tab} key={tab}>
                {translate(`organiser.tabs.${tab}`)}
              </Tab>
            ))}
          </TabList>
        </div>
        <TabPanel id='live'>
          <LiveTables event={event} onRecord={organiser.record} />
        </TabPanel>
        <TabPanel id='plan'>
          <HallPlanBoard
            accesses={snapshot.tableAccesses}
            event={event}
            eventId={eventId}
            onRecord={organiser.record}
            onSave={organiser.saveSetup}
            setup={setup}
          />
        </TabPanel>
        <TabPanel id='matches'>
          <MatchesEditor
            matches={event.matches}
            onRecord={organiser.record}
            onSave={organiser.saveSetup}
            setup={setup}
          />
        </TabPanel>
        <TabPanel id='players'>
          <PlayersEditor onSave={organiser.saveSetup} setup={setup} />
        </TabPanel>
        <TabPanel id='encounters'>
          <div className='organiser-stack'>
            {encounterLinesFor(event).length === 0 ? (
              <p className='organiser-empty'>
                {translate('organiser.encounter.empty')}
              </p>
            ) : (
              <ul className='encounter-list'>
                {encounterLinesFor(event).map((encounter) => (
                  <li key={encounter.id}>
                    <EncounterScore encounter={encounter} />
                    <PlayerForfeit
                      encounterId={encounter.id}
                      matches={event.matches}
                      onRecord={organiser.record}
                      setup={setup}
                    />
                  </li>
                ))}
              </ul>
            )}
            <ClubEncounterForm onSave={organiser.saveSetup} setup={setup} />
            <EncounterForm onSave={organiser.saveSetup} setup={setup} />
          </div>
        </TabPanel>
        <TabPanel id='tournament'>
          <TournamentEditor
            matches={event.matches}
            onSave={organiser.saveSetup}
            setup={setup}
          />
        </TabPanel>
        <TabPanel id='tables'>
          <div className='organiser-stack'>
            <WallPairingForm
              code={code}
              eventId={eventId}
              scannedCode={scannedPairingCode}
              setup={setup}
            />
            <h2 className='organiser-subheading'>
              {translate('organiser.access.title')}
            </h2>
            <TableAccesses
              accesses={snapshot.tableAccesses}
              eventId={eventId}
              eventName={setup.name}
            />
            <h2 className='organiser-subheading'>
              {translate('organiser.displays.title')}
            </h2>
            <DisplaysEditor
              eventId={eventId}
              onSave={organiser.saveSetup}
              setup={setup}
            />
          </div>
        </TabPanel>
        <TabPanel id='settings'>
          <p className='organiser-note organiser-code-note'>
            {translate('organiser.code.yours')}
            <b>{code}</b>
          </p>
          <EventSettingsForm
            key={JSON.stringify(setup.club) + setup.name + setup.tableCount}
            onSave={organiser.saveSetup}
            setup={setup}
          />
          <EventDeletion onDelete={organiser.deleteEvent} />
        </TabPanel>
      </Tabs>
    </Main>
  )
}

const OrganiserCodeForm: React.FC<{
  onCode: (code: OrganiserCode) => void
}> = ({ onCode }) => {
  const translate = useTranslate()
  const [typed, setTyped] = useState('')
  const code = organiserCodeSchema.safeParse(typed.trim().toUpperCase())

  return (
    <Main className='organiser-gate'>
      <DocumentTitle>{translate('organiser.title')}</DocumentTitle>
      <Form
        className='organiser-gate-form'
        onSubmit={(event) => {
          event.preventDefault()

          if (code.success) {
            onCode(code.data)
          }
        }}
      >
        <BrandMark />
        <h1>{translate('organiser.code.title')}</h1>
        <p>{translate('organiser.code.explain')}</p>
        <TextField isRequired onChange={setTyped} value={typed}>
          <Label>{translate('organiser.code.label')}</Label>
          <Input
            autoCapitalize='characters'
            autoComplete='off'
            className='organiser-code-input'
          />
        </TextField>
        <Button isDisabled={!code.success} type='submit' variant='primary'>
          {translate('organiser.code.submit')}
        </Button>
      </Form>
    </Main>
  )
}

/** The organiser's console: prepare the event and change anything while it runs. */
export const OrganiserPage: React.FC = () => {
  const translate = useTranslate()
  const eventId = useEventIdParam()
  const [code, setCode] = useState(() =>
    eventId === null ? null : storedCodeOrNull(eventId)
  )

  if (eventId === null) {
    return (
      <FeedMessage
        message={translate('error.event_not_found')}
        title={translate('organiser.title')}
      />
    )
  }

  if (code === null) {
    return (
      <OrganiserCodeForm
        onCode={(entered) => {
          writeOrganiserCode({ code: entered, eventId })
          setCode(entered)
        }}
      />
    )
  }

  return <OrganiserConsole code={code} eventId={eventId} />
}
