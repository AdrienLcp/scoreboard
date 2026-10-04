import type React from 'react'

import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { EventId, PlayerId } from '@scoreboard/protocol/identifiers'

import { spectatorProgrammeFor } from '@scoreboard/core/event/spectator-programme'

import {
  encounterLinesFor,
  encounterTitleOf
} from '@/features/event/encounter-lines'
import { EncounterScore } from '@/features/event/encounter-score'
import { FeedMessage } from '@/features/event/feed-message'
import { sideName } from '@/features/event/participant-names'
import { startLabel } from '@/features/event/start-label'
import { useCurrentSnapshot } from '@/features/event/use-current-snapshot'
import { usePublicFeed } from '@/features/event/use-public-feed'
import { toDate } from '@/infrastructure/dates'
import { useEventIdParam } from '@/infrastructure/router/navigation'
import { BrandMark } from '@/presentation/components/brand-mark'
import { Icon } from '@/presentation/components/icon'
import { Main } from '@/presentation/components/main'
import { TableNumber } from '@/presentation/components/table-number'
import { Tab, TabList, TabPanel, Tabs } from '@/presentation/components/tabs'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-context'
import { socketStatusKey } from '@/presentation/i18n/translation'

import { FollowField } from './follow-field'
import { followedFirst, involvesAnyOf } from './followed-first'
import { MatchCard } from './match-card'
import { useFollowedPlayers } from './use-followed-players'

import './spectator-page.sass'

type ProgrammeTab = 'live' | 'finished' | 'upcoming'

const TABS: readonly ProgrammeTab[] = ['live', 'finished', 'upcoming']

const startOf = (match: MatchView): number | null =>
  match.timing.estimatedStartMs ?? match.plannedAtMs

const SpectatorProgramme: React.FC<{ eventId: EventId }> = ({ eventId }) => {
  const translate = useTranslate()
  const feed = usePublicFeed({
    eventId,
    role: 'spectator'
  })
  const { error, status } = feed
  const { nowMs, snapshot } = useCurrentSnapshot(feed.snapshot)
  const { follow, followed, unfollow } = useFollowedPlayers(eventId)

  if (snapshot === null) {
    return (
      <FeedMessage
        error={error}
        status={status}
        title={translate('spectator.title')}
      />
    )
  }

  const programme = spectatorProgrammeFor(snapshot)
  const finished = programme.finished.toSorted(
    (left, right) =>
      (right.timing.finishedAtMs ?? 0) - (left.timing.finishedAtMs ?? 0)
  )
  const upcoming = programme.upcoming.toSorted(
    (left, right) =>
      (startOf(left) ?? Number.POSITIVE_INFINITY) -
      (startOf(right) ?? Number.POSITIVE_INFINITY)
  )
  const matchesOf = { finished, live: programme.live, upcoming }
  const encounters = encounterLinesFor(snapshot)
  const encounterTitleFor = (match: MatchView): string | null => {
    const line = encounters.find(
      (encounter) => encounter.id === match.encounterId
    )

    return line === undefined ? null : encounterTitleOf(line)
  }
  const onFollow = (playerId: PlayerId, isFollowing: boolean) =>
    isFollowing ? follow(playerId) : unfollow(playerId)
  const whereIs = (playerId: PlayerId): string => {
    const live = programme.live.find((match) =>
      involvesAnyOf(match, [playerId])
    )

    if (live !== undefined) {
      return translate('spectator.whereLive', { table: live.table ?? 0 })
    }

    return upcoming.some((match) => involvesAnyOf(match, [playerId]))
      ? translate('spectator.section.upcoming')
      : translate('spectator.section.finished')
  }
  const namesOf = (match: MatchView): string =>
    [match.home, match.away]
      .map(
        (participant) =>
          sideName({ form: 'full', participant, players: snapshot.players }) ??
          translate('match.unnamedSide')
      )
      .join(' – ')

  const card = (match: MatchView) => (
    <MatchCard
      encounterTitle={encounterTitleFor(match)}
      followed={followed}
      key={match.id}
      match={match}
      nowMs={nowMs}
      onFollow={onFollow}
      players={snapshot.players}
    />
  )
  const upcomingItem = (match: MatchView) => {
    const start = startOf(match)

    return (
      <article className='upcoming-item' key={match.id}>
        <span className='upcoming-time'>
          {start === null
            ? translate('spectator.noTime')
            : startLabel({ nowMs, startMs: start, translate })}
        </span>
        <div>
          <p className='upcoming-names'>
            <span>{namesOf(match)}</span>
            {involvesAnyOf(match, followed) ? <Icon name='star' /> : null}
          </p>
          <p className='upcoming-detail'>
            {[
              match.table === null ? translate('spectator.noTable') : null,
              encounterTitleFor(match),
              match.label
            ]
              .filter((part) => part !== null)
              .join(' · ')}
          </p>
        </div>
        {match.table === null ? null : (
          <TableNumber className='upcoming-table' number={match.table} />
        )}
      </article>
    )
  }

  return (
    <Main className='spectator-page'>
      <DocumentTitle>{`${snapshot.name} — ${translate('spectator.title')}`}</DocumentTitle>
      <header className='spectator-top'>
        <BrandMark />
        <p
          className='spectator-status'
          data-open={status === 'open' || undefined}
        >
          {status === 'open' ? (
            <span aria-hidden='true' className='spectator-dot' />
          ) : (
            <Icon name='wifiOff' />
          )}
          {translate(socketStatusKey(status))}
        </p>
      </header>
      <section className='spectator-event'>
        <h1>{snapshot.club?.name ?? snapshot.name}</h1>
        <p>
          {snapshot.club === null ? null : (
            <>
              {snapshot.name}
              <br />
            </>
          )}
          {translate('display.date', { at: toDate(nowMs) })}
        </p>
      </section>
      <FollowField
        followed={followed}
        onFollow={follow}
        onUnfollow={unfollow}
        players={snapshot.players}
        whereIs={whereIs}
      />
      <Tabs className='spectator-tabs' defaultSelectedKey='live'>
        <div className='spectator-tab-bar'>
          <TabList aria-label={translate('spectator.title')}>
            {TABS.map((tab) => (
              <Tab id={tab} key={tab}>
                {translate(`spectator.section.${tab}`)}
                <span className='tab-count'>{matchesOf[tab].length}</span>
              </Tab>
            ))}
          </TabList>
        </div>
        {TABS.map((tab) => {
          const split = followedFirst(matchesOf[tab], followed)
          const render = tab === 'upcoming' ? upcomingItem : card

          return (
            <TabPanel id={tab} key={tab}>
              {tab === 'live' && encounters.length > 0 ? (
                <>
                  <h2 className='spectator-group'>
                    {translate('display.encounters')}
                  </h2>
                  <div className='spectator-encounters'>
                    {encounters.map((encounter) => (
                      <div className='spectator-encounter' key={encounter.id}>
                        <EncounterScore encounter={encounter} />
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
              {split.followed.length === 0 ? null : (
                <>
                  <h2 className='spectator-group'>
                    {translate('spectator.yourPlayers')}
                  </h2>
                  {split.followed.map(render)}
                </>
              )}
              {split.others.length === 0 ? null : (
                <>
                  {split.followed.length === 0 &&
                  !(tab === 'live' && encounters.length > 0) ? null : (
                    <h2 className='spectator-group'>
                      {translate(
                        tab === 'live'
                          ? 'spectator.tablesInPlay'
                          : 'spectator.others'
                      )}
                    </h2>
                  )}
                  {split.others.map(render)}
                </>
              )}
              {matchesOf[tab].length === 0 ? (
                <p className='spectator-empty'>
                  {translate(`spectator.empty.${tab}`)}
                </p>
              ) : null}
            </TabPanel>
          )
        })}
      </Tabs>
    </Main>
  )
}

/** A visitor's phone: the whole day, read-only, reached from the display's QR code. */
export const SpectatorPage: React.FC = () => {
  const translate = useTranslate()
  const eventId = useEventIdParam()

  if (eventId === null) {
    return (
      <FeedMessage
        message={translate('error.event_not_found')}
        title={translate('spectator.title')}
      />
    )
  }

  return <SpectatorProgramme eventId={eventId} />
}
