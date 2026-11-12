import type React from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type {
  PublicSnapshot,
  TableAccess
} from '@scoreboard/protocol/event-snapshot'
import type { HallPlan } from '@scoreboard/protocol/hall-plan'
import type {
  EventId,
  MatchId,
  TableNumber
} from '@scoreboard/protocol/identifiers'
import type { ScoringEvent } from '@scoreboard/protocol/scoring-event'

import { blockOf, isInTouchingBlock } from '@scoreboard/core/hall/hall-plan'

import { useClubTranslate } from '@/features/club/use-club-translate'
import type { EncounterLine } from '@/features/event/encounter-lines'
import { EncounterScore } from '@/features/event/encounter-score'
import { pageOrigin } from '@/infrastructure/browser'
import { umpirePathFor } from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { CodeAndQr } from '@/presentation/components/code-and-qr'
import { Icon } from '@/presentation/components/icon'

import { ConfirmButton } from './confirm-button'
import { TableMatchPanel } from './table-match-panel'

import './hall-table-sheet.sass'

type HallTableSheetProps = {
  access: TableAccess | undefined
  /** The last table of the hall cannot go. */
  canDelete: boolean
  encounter: EncounterLine | undefined
  event: PublicSnapshot
  eventId: EventId
  /** Its block hosts an encounter: off for a tournament. */
  hasBlocks: boolean
  onChooseEncounter: (trigger: HTMLElement) => void
  onClose: () => void
  onDelete: () => void
  onPutAway: () => void
  onRecord: (matchId: MatchId, event: ScoringEvent) => void
  /** Saves any other change to the setup, the sheet staying open. */
  onSaveSetup: (setup: EventSetup) => void
  onTurn: () => void
  plan: HallPlan
  setup: EventSetup
  table: TableNumber
}

/**
 * One table of the plan, opened: its encounter and score, the match on it with
 * its umpire and its score to correct, its umpire QR and code big enough to
 * show the umpire who arrives, and what can change.
 */
export const HallTableSheet: React.FC<HallTableSheetProps> = ({
  access,
  canDelete,
  encounter,
  event,
  eventId,
  hasBlocks,
  onChooseEncounter,
  onClose,
  onDelete,
  onPutAway,
  onRecord,
  onSaveSetup,
  onTurn,
  plan,
  setup,
  table
}) => {
  const translate = useClubTranslate()
  const [first, second] = blockOf(table)
  const block = second <= setup.tableCount ? `${first}–${second}` : `${first}`

  return (
    <section aria-labelledby='hall-sheet-title' className='hall-sheet'>
      <header className='hall-sheet-head'>
        <h3 id='hall-sheet-title'>
          {translate('organiser.access.table', { table })}
        </h3>
        <Button
          aria-label={translate('organiser.hall.close')}
          onPress={onClose}
          variant='quiet'
        >
          <Icon name='close' />
        </Button>
      </header>
      {encounter === undefined ? (
        <p className='organiser-note'>{translate('organiser.hall.freeLong')}</p>
      ) : (
        <EncounterScore encounter={encounter} />
      )}
      <TableMatchPanel
        event={event}
        key={table}
        onRecord={onRecord}
        onSaveSetup={onSaveSetup}
        setup={setup}
        table={table}
      />
      {access === undefined ? null : (
        <CodeAndQr
          code={access.code}
          codeHint={translate('organiser.access.codeHint')}
          qrLabel={translate('organiser.access.qrLabel', { table })}
          scanHint={translate('organiser.access.scanHint')}
          url={`${pageOrigin()}${umpirePathFor({ code: access.code, eventId })}`}
        />
      )}
      <div className='hall-sheet-actions'>
        {hasBlocks ? (
          <Button
            aria-haspopup='dialog'
            onPress={(press) => {
              if (press.target instanceof HTMLElement) {
                onChooseEncounter(press.target)
              }
            }}
          >
            <Icon name='swap' />
            {translate('organiser.plan.chooseOn', { block })}
          </Button>
        ) : null}
        <Button onPress={onTurn}>
          <Icon name='rotate' />
          {isInTouchingBlock(plan, table)
            ? translate('organiser.plan.turnBlock', { block })
            : translate('organiser.plan.turn')}
        </Button>
        <Button onPress={onPutAway}>
          <Icon name='reserve' />
          {translate('organiser.plan.putAway')}
        </Button>
        {canDelete ? (
          <ConfirmButton
            confirmLabel={translate('organiser.plan.deleteTable', { table })}
            label={translate('organiser.plan.delete')}
            onConfirm={onDelete}
          />
        ) : null}
      </div>
    </section>
  )
}
