import type React from 'react'

import type { PublicSnapshot } from '@scoreboard/protocol/event-snapshot'
import type { DisplayId, EventId } from '@scoreboard/protocol/identifiers'

import {
  displayBoardFor,
  type TableTile,
  tablesShownOn
} from '@scoreboard/core/event/display-board'

import { MatchLine } from '@/features/event/match-line'
import { usePublicFeed } from '@/features/event/use-public-feed'
import { pageOrigin } from '@/infrastructure/browser'
import {
  spectatorPathFor,
  useDisplayIdParam,
  useEventIdParam
} from '@/infrastructure/router/navigation'
import { Main } from '@/presentation/components/main'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import {
  protocolErrorKey,
  socketStatusKey
} from '@/presentation/i18n/translation'

const Tile: React.FC<{ snapshot: PublicSnapshot; tile: TableTile }> = ({
  snapshot,
  tile
}) => {
  const translate = useTranslate()

  return (
    <li>
      <h3>{translate('table.name', { number: tile.table })}</h3>
      <p>{translate(`display.phase.${tile.phase}`)}</p>
      {tile.match === null ? null : (
        <MatchLine match={tile.match} players={snapshot.players} />
      )}
    </li>
  )
}

const DisplayBoard: React.FC<{
  displayId: DisplayId | null
  eventId: EventId
}> = ({ displayId, eventId }) => {
  const translate = useTranslate()
  const { error, snapshot, status } = usePublicFeed({
    eventId,
    role: 'display'
  })

  if (snapshot === null) {
    return (
      <Main>
        <title>{translate('display.title')}</title>
        <p>{translate(socketStatusKey(status))}</p>
        {error === null ? null : (
          <p>{translate(protocolErrorKey(error.code))}</p>
        )}
      </Main>
    )
  }

  const tables = tablesShownOn({
    displayId,
    displays: snapshot.displays,
    tableCount: snapshot.tableCount
  })

  if (tables === null) {
    return (
      <Main>
        <title>{snapshot.name}</title>
        <p>{translate('display.unknown')}</p>
      </Main>
    )
  }

  const board = displayBoardFor(snapshot, tables)

  return (
    <Main>
      <title>{snapshot.name}</title>
      <h1>{snapshot.club?.name ?? snapshot.name}</h1>
      <p>{translate(socketStatusKey(status))}</p>
      <section>
        <h2>{translate('display.live')}</h2>
        <ol>
          {board.live.map((tile) => (
            <Tile key={tile.table} snapshot={snapshot} tile={tile} />
          ))}
        </ol>
      </section>
      <section>
        <h2>{translate('display.quiet')}</h2>
        <ol>
          {board.quiet.map((tile) => (
            <Tile key={tile.table} snapshot={snapshot} tile={tile} />
          ))}
        </ol>
      </section>
      <p>
        {translate('display.follow', {
          url: `${pageOrigin()}${spectatorPathFor(eventId)}`
        })}
      </p>
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
      <Main>
        <title>{translate('display.title')}</title>
        <p>
          {translate(
            eventId === null ? 'error.event_not_found' : 'display.unknown'
          )}
        </p>
      </Main>
    )
  }

  return <DisplayBoard displayId={displayId} eventId={eventId} />
}
