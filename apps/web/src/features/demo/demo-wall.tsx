import type React from 'react'

import type { PublicSnapshot } from '@scoreboard/protocol/event-snapshot'
import type { EventId } from '@scoreboard/protocol/identifiers'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'

import { tablesShownOn } from '@scoreboard/core/event/display-board'

import { DisplayHeader } from '@/features/display/display-header'
import { WallBoard } from '@/features/display/wall-board'
import { wallRowsFor } from '@/features/display/wall-rows'
import { wallViewOf } from '@/features/display/wall-view'
import { pageOrigin } from '@/infrastructure/browser'
import { paths } from '@/infrastructure/router/navigation'
import { withClass } from '@/presentation/components/class-names'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import '@/features/display/display-page.sass'

/** Shown under the wall's QR code; no event answers to it. */
const DEMO_EVENT_ID: EventId = 'k7p4rvm2qd'

type DemoWallProps = {
  className?: string
  nowMs: InstantMs
  snapshot: PublicSnapshot
}

/**
 * The club's real wall over the fictional day, its QR code opening this demo
 * on the phone that scans it.
 */
export const DemoWall: React.FC<DemoWallProps> = ({
  className,
  nowMs,
  snapshot
}) => {
  const translate = useTranslate()
  const tables = tablesShownOn({
    displayId: null,
    displays: snapshot.displays,
    tableCount: snapshot.tableCount
  })
  const rows = tables === null ? null : wallRowsFor({ nowMs, snapshot, tables })

  return (
    <div className={withClass('display-page', className)} data-wall>
      <DisplayHeader
        eventName={translate('demo.event')}
        isPairedWall={false}
        isWall
        logoUrl={snapshot.club?.logoUrl ?? null}
        nowMs={nowMs}
        owner={snapshot.club?.name ?? ''}
        page={null}
        scope={null}
        status='open'
      />
      {rows === null ? null : (
        <WallBoard
          eventId={DEMO_EVENT_ID}
          nowMs={nowMs}
          rows={rows}
          snapshot={snapshot}
          spectatorUrl={`${pageOrigin()}${paths.demo}`}
          view={wallViewOf({ display: undefined, wallView: snapshot.wallView })}
        />
      )}
    </div>
  )
}
