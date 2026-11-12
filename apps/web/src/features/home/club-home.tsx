import type React from 'react'

import type { ClubCode } from '@scoreboard/protocol/club-record'

import type { ClubState } from '@/features/club/use-club'
import { useClubTranslate } from '@/features/club/use-club-translate'
import { useCurrentFederationPools } from '@/features/club/use-federation-pools'
import { nowMs } from '@/infrastructure/clock'
import { toLocalDay } from '@/infrastructure/dates'
import { paths } from '@/infrastructure/router/navigation'
import type { OrganisedEvent } from '@/infrastructure/storage/organised-events-storage'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink } from '@/presentation/components/link'

import { clubRoundOf } from './club-day'
import { ClubRoundSection } from './club-round'
import { ClubSeason } from './club-season'
import { FreeDaySection } from './free-day'
import { JoinEventForm } from './join-event-form'
import { OrganisedEvents } from './organised-events'

type ClubHomeProps = {
  onJoin: (code: ClubCode) => void
  organisedEvents: readonly OrganisedEvent[]
  /** Any state but `none`: a device with no club gets the first visit's home instead. */
  state: Exclude<ClubState, { status: 'none' }>
}

/**
 * A device that has a club: its next championship round ready to prepare or
 * pick up again, the events it organises and the season's teams, pools and
 * directory. Its own chunk, so a first visit never downloads it.
 */
export const ClubHome: React.FC<ClubHomeProps> = ({
  onJoin,
  organisedEvents,
  state
}) => {
  const translate = useClubTranslate()
  const record = state.status === 'ready' ? state.record : null
  const federationPools = useCurrentFederationPools(record)
  const round =
    record === null
      ? null
      : clubRoundOf(record, toLocalDay(nowMs()), federationPools)

  return (
    <div className='home-layout'>
      <div className='home-lead'>
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
              <Button onPress={() => onJoin(state.code)}>
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
          <ClubSeason
            code={state.code}
            federationPools={federationPools}
            record={state.record}
          />
        ) : null}
        <JoinEventForm />
      </div>
    </div>
  )
}
