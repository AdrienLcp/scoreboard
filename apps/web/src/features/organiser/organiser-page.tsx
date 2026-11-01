import type React from 'react'
import { useState } from 'react'

import type { EventId, OrganiserCode } from '@scoreboard/protocol/identifiers'
import { organiserCodeSchema } from '@scoreboard/protocol/identifiers'

import { FeedMessage } from '@/features/event/feed-message'
import { useEventIdParam } from '@/infrastructure/router/navigation'
import {
  readOrganiserCode,
  writeOrganiserCode
} from '@/infrastructure/storage/organiser-code-storage'
import { BrandMark } from '@/presentation/components/brand-mark'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Main } from '@/presentation/components/main'
import { Input, Label, TextField } from '@/presentation/components/text-field'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { OrganiserConsole } from './organiser-console'

import './organiser-page.sass'

/** A device that cannot read storage asks for the code, as one that never had it. */
const storedCodeOrNull = (eventId: EventId): OrganiserCode | null => {
  const stored = readOrganiserCode(eventId)

  return stored.status === 'success' ? stored.data : null
}

const OrganiserCodeForm: React.FC<{
  onCode: (code: OrganiserCode) => void
}> = ({ onCode }) => {
  const translate = useTranslate()
  const [typed, setTyped] = useState('')
  const code = organiserCodeSchema.safeParse(typed.trim().toUpperCase())

  return (
    <Main className='organiser-gate'>
      <DocumentTitle>{translate('organiser.title')}</DocumentTitle>
      <Form
        className='organiser-gate-form'
        onSubmit={(event) => {
          event.preventDefault()

          if (code.success) {
            onCode(code.data)
          }
        }}
      >
        <BrandMark />
        <h1>{translate('organiser.code.title')}</h1>
        <p>{translate('organiser.code.explain')}</p>
        <TextField isRequired onChange={setTyped} value={typed}>
          <Label>{translate('organiser.code.label')}</Label>
          <Input
            autoCapitalize='characters'
            autoComplete='off'
            className='organiser-code-input'
          />
        </TextField>
        <Button isDisabled={!code.success} type='submit' variant='primary'>
          {translate('organiser.code.submit')}
        </Button>
      </Form>
    </Main>
  )
}

/** The organiser's console: prepare the event and change anything while it runs. */
export const OrganiserPage: React.FC = () => {
  const translate = useTranslate()
  const eventId = useEventIdParam()
  const [code, setCode] = useState(() =>
    eventId === null ? null : storedCodeOrNull(eventId)
  )

  if (eventId === null) {
    return (
      <FeedMessage
        message={translate('error.event_not_found')}
        title={translate('organiser.title')}
      />
    )
  }

  if (code === null) {
    return (
      <OrganiserCodeForm
        onCode={(entered) => {
          writeOrganiserCode({ code: entered, eventId })
          setCode(entered)
        }}
      />
    )
  }

  return <OrganiserConsole code={code} eventId={eventId} />
}
