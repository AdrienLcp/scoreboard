import type React from 'react'
import { useId } from 'react'

import { EVENT_RETENTION_DAYS } from '@scoreboard/protocol/event-retention'

import { useTranslate } from '@/presentation/i18n/i18n-context'

import { ConfirmButton } from './confirm-button'

type EventDeletionProps = {
  onDelete: () => void
}

/** Erases the event ahead of its retention, behind a second press. */
export const EventDeletion: React.FC<EventDeletionProps> = ({ onDelete }) => {
  const translate = useTranslate()
  const titleId = useId()

  return (
    <section
      aria-labelledby={titleId}
      className='organiser-panel event-deletion'
    >
      <h3 id={titleId}>{translate('organiser.deletion.title')}</h3>
      <p className='organiser-note'>
        {translate('organiser.deletion.explain', {
          days: EVENT_RETENTION_DAYS
        })}
      </p>
      <ConfirmButton
        confirmLabel={translate('organiser.deletion.confirm')}
        label={translate('organiser.deletion.label')}
        onConfirm={onDelete}
      />
    </section>
  )
}
