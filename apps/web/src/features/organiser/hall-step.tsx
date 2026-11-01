import type React from 'react'
import type { ComponentProps } from 'react'

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

import { organiserStepPathFor } from '@/infrastructure/router/navigation'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink } from '@/presentation/components/link'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { HallPlanBoard } from './hall-plan'
import { ScreensPanel } from './screens-panel'
import { TableSheetsButton } from './table-sheets-button'

type HallStepProps = {
  accesses: readonly TableAccess[]
  code: OrganiserCode
  connectedScreens: ComponentProps<typeof ScreensPanel>['connectedScreens']
  event: PublicSnapshot
  eventId: EventId
  onRecord: (matchId: MatchId, event: ScoringEvent) => void
  onSave: (setup: EventSetup) => boolean
  setup: EventSetup
}

/** The hall as it stands today, its screens and its tables' QR sheets, then on to the encounters. */
export const HallStep: React.FC<HallStepProps> = ({
  accesses,
  code,
  connectedScreens,
  event,
  eventId,
  onRecord,
  onSave,
  setup
}) => {
  const translate = useTranslate()
  const standing = accesses.filter((access) =>
    (setup.hall?.tables ?? []).every(
      (table) => table.table !== access.table || !table.isHidden
    )
  )

  return (
    <HallPlanBoard
      accesses={accesses}
      aside={
        <>
          <ScreensPanel
            code={code}
            connectedScreens={connectedScreens}
            event={event}
            eventId={eventId}
            onSave={onSave}
            setup={setup}
          />
          <section aria-labelledby='qr-title' className='step-panel'>
            <h2 id='qr-title'>{translate('organiser.hallStep.qrTitle')}</h2>
            <p className='organiser-note'>
              {translate('organiser.hallStep.qrHint')}
            </p>
            <TableSheetsButton
              accesses={standing}
              eventId={eventId}
              eventName={setup.name}
            />
          </section>
          <ButtonLink
            className='step-next'
            href={organiserStepPathFor({ eventId, step: 'encounters' })}
            variant='primary'
          >
            {translate('organiser.steps.next.encounters')}
            <Icon name='arrowRight' />
          </ButtonLink>
        </>
      }
      event={event}
      eventId={eventId}
      onRecord={onRecord}
      onSave={onSave}
      setup={setup}
    />
  )
}
