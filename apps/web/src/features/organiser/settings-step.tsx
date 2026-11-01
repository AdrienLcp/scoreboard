import type React from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type {
  PublicSnapshot,
  TableAccess
} from '@scoreboard/protocol/event-snapshot'
import type {
  EventId,
  MatchId,
  OrganiserCode
} from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'

import {
  clubPathFrom,
  organiserPathFor,
  spectatorPathFor
} from '@/infrastructure/router/navigation'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink } from '@/presentation/components/link'
import { Tab, TabList, TabPanel, Tabs } from '@/presentation/components/tabs'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { EventDeletion } from './event-deletion'
import { EventSettingsForm } from './event-settings-form'
import { MatchesEditor } from './matches-editor'
import { PlayersEditor } from './players-editor'
import { TableAccesses } from './table-accesses'

type SettingsStepProps = {
  accesses: readonly TableAccess[]
  code: OrganiserCode
  event: PublicSnapshot
  eventId: EventId
  onDelete: () => void
  onRecord: (matchId: MatchId, event: ScoringEvent) => void
  onSave: (setup: EventSetup) => boolean
  setup: EventSetup
}

/**
 * Everything the three steps do not show, kept one tap away: the event's
 * settings, its players, the whole programme in playing order and each
 * table's umpire code.
 */
export const SettingsStep: React.FC<SettingsStepProps> = ({
  accesses,
  code,
  event,
  eventId,
  onDelete,
  onRecord,
  onSave,
  setup
}) => {
  const translate = useTranslate()

  return (
    <section aria-labelledby='settings-title' className='settings-step'>
      <ButtonLink
        className='settings-back'
        href={organiserPathFor(eventId)}
        variant='quiet'
      >
        <Icon name='arrowLeft' />
        {translate('organiser.steps.back')}
      </ButtonLink>
      <h2 className='settings-title' id='settings-title'>
        {translate('organiser.steps.settings')}
      </h2>
      <Tabs className='organiser-tabs' defaultSelectedKey='event'>
        <div className='organiser-tab-bar'>
          <TabList aria-label={translate('organiser.steps.settings')}>
            <Tab id='event'>{translate('organiser.tabs.settings')}</Tab>
            <Tab id='players'>{translate('organiser.tabs.players')}</Tab>
            <Tab id='matches'>{translate('organiser.tabs.matches')}</Tab>
            <Tab id='tables'>{translate('organiser.access.title')}</Tab>
          </TabList>
        </div>
        <TabPanel id='event'>
          <div className='organiser-stack'>
            <p className='organiser-note organiser-code-note'>
              {translate('organiser.code.yours')}
              <b>{code}</b>
            </p>
            <EventSettingsForm
              key={JSON.stringify(setup.club) + setup.name + setup.tableCount}
              onSave={onSave}
              setup={setup}
            />
            <div className='settings-links'>
              <ButtonLink href={clubPathFrom(eventId)}>
                <Icon name='club' />
                {translate('organiser.club')}
              </ButtonLink>
              <ButtonLink href={spectatorPathFor(eventId)} target='_blank'>
                <Icon name='open' />
                {translate('organiser.access.spectator')}
              </ButtonLink>
            </div>
            <EventDeletion onDelete={onDelete} />
          </div>
        </TabPanel>
        <TabPanel id='players'>
          <PlayersEditor onSave={onSave} setup={setup} />
        </TabPanel>
        <TabPanel id='matches'>
          <MatchesEditor
            matches={event.matches}
            onRecord={onRecord}
            onSave={onSave}
            setup={setup}
          />
        </TabPanel>
        <TabPanel id='tables'>
          <TableAccesses
            accesses={accesses}
            eventId={eventId}
            eventName={setup.name}
          />
        </TabPanel>
      </Tabs>
    </section>
  )
}
