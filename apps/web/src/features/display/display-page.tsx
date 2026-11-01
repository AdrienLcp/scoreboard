import type React from 'react'

import type { DisplayId, EventId } from '@scoreboard/protocol/identifiers'

import { tablesShownOn } from '@scoreboard/core/event/display-board'

import {
  encounterLinesFor,
  encounterTitleOf
} from '@/features/event/encounter-lines'
import { isEventGone } from '@/features/event/event-gone'
import { FeedMessage } from '@/features/event/feed-message'
import { useCurrentSnapshot } from '@/features/event/use-current-snapshot'
import { usePublicFeed } from '@/features/event/use-public-feed'
import { pageOrigin } from '@/infrastructure/browser'
import {
  spectatorPathFor,
  useDisplayIdParam,
  useEventIdParam
} from '@/infrastructure/router/navigation'
import { Main } from '@/presentation/components/main'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { useForgetGoneWall } from '../wall/use-forget-gone-wall'
import { DisplayHeader, type PageIndicator } from './display-header'
import { firstStartOf, hasNotStarted } from './display-summary'
import { LiveBoard } from './live-board'
import { tableScopeOf } from './table-scope'
import { WaitingStage } from './waiting-stage'
import { WallBoard } from './wall-board'
import { wallRowsFor } from './wall-rows'
import { wallTournamentFor } from './wall-tournament'
import { WallTournamentBoard } from './wall-tournament-board'
import { wallViewOf } from './wall-view'

import './display-page.sass'

const DisplayBoard: React.FC<{
  displayId: DisplayId | null
  eventId: EventId
}> = ({ displayId, eventId }) => {
  const translate = useTranslate()
  const feed = usePublicFeed({
    displayId,
    eventId,
    role: 'display'
  })
  const { error, status } = feed
  const { nowMs, snapshot } = useCurrentSnapshot(feed.snapshot)
  const tables =
    snapshot === null
      ? null
      : tablesShownOn({
          displayId,
          displays: snapshot.displays,
          tableCount: snapshot.tableCount
        })
  const isPairedWall = useForgetGoneWall({
    displayId,
    eventId,
    isGone: isEventGone(error) || (snapshot !== null && tables === null)
  })

  if (snapshot === null) {
    return (
      <FeedMessage
        error={error}
        status={status}
        title={translate('display.title')}
      />
    )
  }

  if (tables === null) {
    return (
      <FeedMessage
        message={translate('display.unknown')}
        title={snapshot.name}
      />
    )
  }

  const display = snapshot.displays.find(
    (candidate) => candidate.id === displayId
  )
  const scope =
    display === undefined
      ? null
      : `${display.name} · ${tableScopeOf(translate, tables)}`
  const encounterLines = encounterLinesFor(snapshot)
  const encounters = encounterLines.filter(
    (encounter) =>
      encounter.tables.length === 0 ||
      encounter.tables.some((table) => tables.includes(table))
  )
  const encounterTitleFor = (match: { encounterId: string | null }) => {
    const line = encounterLines.find(
      (encounter) => encounter.id === match.encounterId
    )

    return line === undefined ? null : encounterTitleOf(line)
  }
  const spectatorUrl = `${pageOrigin()}${spectatorPathFor(eventId)}`
  const wallRows = wallRowsFor({ nowMs, snapshot, tables })
  const tournamentRows =
    wallRows === null ? wallTournamentFor({ nowMs, snapshot, tables }) : null
  const isWall = wallRows !== null || tournamentRows !== null
  const view = wallViewOf({ display, wallView: snapshot.wallView })
  const header = (page: PageIndicator | null) => (
    <DisplayHeader
      eventName={snapshot.name}
      isPairedWall={isPairedWall}
      isWall={isWall}
      logoUrl={snapshot.club?.logoUrl ?? null}
      nowMs={nowMs}
      owner={snapshot.club?.name ?? translate('app.name')}
      page={page}
      scope={scope}
      status={status}
    />
  )

  return (
    <Main className='display-page' data-wall={isWall || undefined}>
      <DocumentTitle>
        {`${display?.name ?? translate('display.title')} — ${snapshot.name}`}
      </DocumentTitle>
      {wallRows !== null ? (
        <>
          {header(null)}
          <WallBoard
            eventId={eventId}
            nowMs={nowMs}
            rows={wallRows}
            snapshot={snapshot}
            spectatorUrl={spectatorUrl}
            view={view}
          />
        </>
      ) : tournamentRows !== null ? (
        <>
          {header(null)}
          <WallTournamentBoard
            eventId={eventId}
            nowMs={nowMs}
            rows={tournamentRows}
            snapshot={snapshot}
            spectatorUrl={spectatorUrl}
            view={view}
          />
        </>
      ) : hasNotStarted(snapshot) ? (
        <>
          {header(null)}
          <WaitingStage
            encounters={encounters}
            firstStartMs={firstStartOf(snapshot)}
            spectatorUrl={spectatorUrl}
            tableCount={tables.length}
          />
        </>
      ) : (
        <LiveBoard
          encounters={encounters}
          encounterTitleFor={encounterTitleFor}
          nowMs={nowMs}
          renderHeader={header}
          snapshot={snapshot}
          spectatorUrl={spectatorUrl}
          tables={tables}
        />
      )}
    </Main>
  )
}

/** A big screen: its tables and their matches, live. */
export const DisplayPage: React.FC = () => {
  const translate = useTranslate()
  const eventId = useEventIdParam()
  const displayId = useDisplayIdParam()

  if (eventId === null || displayId === 'unknown') {
    return (
      <FeedMessage
        message={translate(
          eventId === null ? 'error.event_not_found' : 'display.unknown'
        )}
        title={translate('display.title')}
      />
    )
  }

  return <DisplayBoard displayId={displayId} eventId={eventId} />
}
