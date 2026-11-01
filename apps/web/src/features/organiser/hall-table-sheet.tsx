import type React from 'react'

import type { TableAccess } from '@scoreboard/protocol/event-snapshot'
import type { HallPlan } from '@scoreboard/protocol/hall-plan'
import type {
  EncounterId,
  EventId,
  TableNumber
} from '@scoreboard/protocol/identifiers'

import {
  isHiddenIn,
  renumberHallTable,
  toggleHallTable
} from '@scoreboard/core/hall/hall-plan'

import type { EncounterLine } from '@/features/event/encounter-lines'
import { EncounterScore } from '@/features/event/encounter-score'
import { pageOrigin } from '@/infrastructure/browser'
import { umpirePathFor } from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { CodeAndQr } from '@/presentation/components/code-and-qr'
import { Icon } from '@/presentation/components/icon'
import { Switch } from '@/presentation/components/switch'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { ChoiceField } from './choice-field'

import './hall-table-sheet.sass'

type HallTableSheetProps = {
  access: TableAccess | undefined
  encounter: EncounterLine | undefined
  eventId: EventId
  onClose: () => void
  onMoveEncounter: (encounterId: EncounterId) => void
  onMoveTable: () => void
  /** Saves the plan, the sheet staying open on the table now numbered `table`. */
  onSaveHall: (hall: HallPlan, table: TableNumber) => void
  plan: HallPlan
  table: TableNumber
  tableCount: number
}

/**
 * One table of the plan, opened: its encounter and score, its umpire QR and
 * code big enough to show the umpire who arrives, and what can change.
 */
export const HallTableSheet: React.FC<HallTableSheetProps> = ({
  access,
  encounter,
  eventId,
  onClose,
  onMoveEncounter,
  onMoveTable,
  onSaveHall,
  plan,
  table,
  tableCount
}) => {
  const translate = useTranslate()
  const isHidden = isHiddenIn(plan, table)

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
      {access === undefined || isHidden ? null : (
        <CodeAndQr
          code={access.code}
          codeHint={translate('organiser.access.codeHint')}
          qrLabel={translate('organiser.access.qrLabel', { table })}
          scanHint={translate('organiser.access.scanHint')}
          url={`${pageOrigin()}${umpirePathFor({ code: access.code, eventId })}`}
        />
      )}
      <div className='hall-sheet-actions'>
        {encounter === undefined ? null : (
          <Button onPress={() => onMoveEncounter(encounter.id)}>
            <Icon name='move' />
            {translate('organiser.hall.moveEncounter')}
          </Button>
        )}
        <Button onPress={onMoveTable}>
          <Icon name='move' />
          {translate('organiser.hall.moveTable')}
        </Button>
        <ChoiceField
          choices={Array.from({ length: tableCount }, (_, index) => ({
            id: String(index + 1),
            label: translate('organiser.access.table', { table: index + 1 })
          }))}
          label={translate('organiser.hall.number')}
          onChange={(id) => {
            const number = Number(id)

            if (id !== null && number !== table) {
              onSaveHall(renumberHallTable({ number, plan, table }), number)
            }
          }}
          selectedId={String(table)}
        />
        <Switch
          isSelected={!isHidden}
          onChange={() => onSaveHall(toggleHallTable(plan, table), table)}
        >
          {translate('organiser.hall.inUse')}
        </Switch>
      </div>
    </section>
  )
}
