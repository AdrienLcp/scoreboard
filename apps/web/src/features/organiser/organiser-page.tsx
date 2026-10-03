import type React from 'react'
import { useState } from 'react'

import type { EventId, OrganiserCode } from '@scoreboard/protocol/identifiers'
import { organiserCodeSchema } from '@scoreboard/protocol/identifiers'

import { encounterLinesFor } from '@/features/event/encounter-lines'
import { EncounterScore } from '@/features/event/encounter-score'
import { FeedMessage } from '@/features/event/feed-message'
import {
  displayPathFor,
  spectatorPathFor,
  useEventIdParam
} from '@/infrastructure/router/navigation'
import {
  readOrganiserCode,
  writeOrganiserCode
} from '@/infrastructure/storage/organiser-code-storage'
import { BrandMark } from '@/presentation/components/brand-mark'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink } from '@/presentation/components/link'
import { Main } from '@/presentation/components/main'
import { Tab, TabList, TabPanel, Tabs } from '@/presentation/components/tabs'
import { Input, Label, TextField } from '@/presentation/components/text-field'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import {
  recordRefusalKey,
  setupRefusalKey,
  socketStatusKey
} from '@/presentation/i18n/translation'

import { DisplaysEditor } from './displays-editor'
import { EncounterForm } from './encounter-form'
import { EventSettingsForm } from './event-settings-form'
import { LiveTables } from './live-tables'
import { MatchesEditor } from './matches-editor'
import { PlayersEditor } from './players-editor'
import { TableAccesses } from './table-accesses'
import { useOrganiserConsole } from './use-organiser-console'

import './organiser-page.sass'

type OrganiserTab =
  | 'live'
  | 'matches'
  | 'players'
  | 'encounters'
  | 'tables'
  | 'settings'

const TABS: readonly OrganiserTab[] = [
  'live',
  'matches',
  'players',
  'encounters',
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
  const organiser = useOrganiserConsole({ code, eventId })
  const { snapshot } = organiser

  if (snapshot === null) {
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
      <Tabs className='organiser-tabs' defaultSelectedKey='live'>
        <div className='organiser-tab-bar'>
          <TabList aria-label={translate('organiser.title')}>
            {TABS.map((tab) => (
              <Tab id={tab} key={tab}>
                {translate(`organiser.tabs.${tab}`)}
              </Tab>
            ))}
          </TabList>
        </div>
        <TabPanel id='live'>
          <LiveTables event={snapshot.event} onRecord={organiser.record} />
        </TabPanel>
        <TabPanel id='matches'>
          <MatchesEditor
            matches={snapshot.event.matches}
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
            {encounterLinesFor(snapshot.event).length === 0 ? (
              <p className='organiser-empty'>
                {translate('organiser.encounter.empty')}
              </p>
            ) : (
              <ul className='encounter-list'>
                {encounterLinesFor(snapshot.event).map((encounter) => (
                  <li key={encounter.id}>
                    <EncounterScore encounter={encounter} />
                  </li>
                ))}
              </ul>
            )}
            <EncounterForm onSave={organiser.saveSetup} setup={setup} />
          </div>
        </TabPanel>
        <TabPanel id='tables'>
          <div className='organiser-stack'>
            <h2 className='organiser-subheading'>
              {translate('organiser.access.title')}
            </h2>
            <TableAccesses
              accesses={snapshot.tableAccesses}
              eventId={eventId}
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
