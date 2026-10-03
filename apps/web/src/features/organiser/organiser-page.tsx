import type React from 'react'
import { useState } from 'react'

import type { EventId, OrganiserCode } from '@scoreboard/protocol/identifiers'
import { organiserCodeSchema } from '@scoreboard/protocol/identifiers'

import { useEventIdParam } from '@/infrastructure/router/navigation'
import {
  readOrganiserCode,
  writeOrganiserCode
} from '@/infrastructure/storage/organiser-code-storage'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Main } from '@/presentation/components/main'
import { Input, Label, TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import {
  protocolErrorKey,
  recordRefusalKey,
  setupRefusalKey,
  socketStatusKey
} from '@/presentation/i18n/translation'

import { DisplaysEditor } from './displays-editor'
import { EncounterForm } from './encounter-form'
import { EventSettingsForm } from './event-settings-form'
import { MatchesEditor } from './matches-editor'
import { PlayersEditor } from './players-editor'
import { TableAccesses } from './table-accesses'
import { useOrganiserConsole } from './use-organiser-console'

/** A device that cannot read storage asks for the code, as one that never had it. */
const storedCodeOrNull = (eventId: EventId): OrganiserCode | null => {
  const stored = readOrganiserCode(eventId)

  return stored.status === 'success' ? stored.data : null
}

const OrganiserConsole: React.FC<{ code: OrganiserCode; eventId: EventId }> = ({
  code,
  eventId
}) => {
  const translate = useTranslate()
  const organiser = useOrganiserConsole({ code, eventId })
  const { snapshot } = organiser

  return (
    <Main>
      <title>{translate('organiser.title')}</title>
      <h1>{snapshot?.setup.name ?? translate('organiser.title')}</h1>
      <p>{translate(socketStatusKey(organiser.status))}</p>
      {organiser.error === null ? null : (
        <p role='alert'>{translate(protocolErrorKey(organiser.error.code))}</p>
      )}
      {organiser.setupRefusal === null ? null : (
        <p role='alert'>{translate(setupRefusalKey(organiser.setupRefusal))}</p>
      )}
      {organiser.recordRefusal === null ? null : (
        <p role='alert'>
          {translate(recordRefusalKey(organiser.recordRefusal))}
        </p>
      )}
      {snapshot === null ? null : (
        <>
          <section>
            <h2>{translate('organiser.access.title')}</h2>
            <TableAccesses
              accesses={snapshot.tableAccesses}
              eventId={eventId}
            />
          </section>
          <section>
            <h2>{translate('organiser.displays.title')}</h2>
            <DisplaysEditor
              eventId={eventId}
              onSave={organiser.saveSetup}
              setup={snapshot.setup}
            />
          </section>
          <section>
            <h2>{translate('organiser.settings.title')}</h2>
            <EventSettingsForm
              key={JSON.stringify(snapshot.setup.club) + snapshot.setup.name}
              onSave={organiser.saveSetup}
              setup={snapshot.setup}
            />
          </section>
          <section>
            <h2>{translate('organiser.players.title')}</h2>
            <PlayersEditor
              onSave={organiser.saveSetup}
              setup={snapshot.setup}
            />
          </section>
          <section>
            <h2>{translate('organiser.encounter.title')}</h2>
            <EncounterForm
              onSave={organiser.saveSetup}
              setup={snapshot.setup}
            />
          </section>
          <section>
            <h2>{translate('organiser.matches.title')}</h2>
            <MatchesEditor
              matches={snapshot.event.matches}
              onRecord={organiser.record}
              onSave={organiser.saveSetup}
              setup={snapshot.setup}
            />
          </section>
        </>
      )}
    </Main>
  )
}

const OrganiserCodeForm: React.FC<{
  onCode: (code: OrganiserCode) => void
}> = ({ onCode }) => {
  const translate = useTranslate()
  const [typed, setTyped] = useState('')
  const code = organiserCodeSchema.safeParse(typed.trim().toUpperCase())

  return (
    <Main>
      <title>{translate('organiser.title')}</title>
      <h1>{translate('organiser.title')}</h1>
      <Form
        onSubmit={(event) => {
          event.preventDefault()

          if (code.success) {
            onCode(code.data)
          }
        }}
      >
        <TextField isRequired onChange={setTyped} value={typed}>
          <Label>{translate('organiser.code.label')}</Label>
          <Input autoComplete='off' />
        </TextField>
        <Button isDisabled={!code.success} type='submit'>
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
      <Main>
        <title>{translate('organiser.title')}</title>
        <p>{translate('error.event_not_found')}</p>
      </Main>
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
