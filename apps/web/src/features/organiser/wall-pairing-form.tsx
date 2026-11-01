import type React from 'react'
import { useState } from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type {
  EventId,
  OrganiserCode,
  WallPairingCode
} from '@scoreboard/protocol/identifiers'
import { PAGE_ROUTES } from '@scoreboard/protocol/page-routes'

import { parseWallPairingCode } from '@scoreboard/core/access/access-codes'

import {
  type ClaimWallError,
  claimWallPairing
} from '@/infrastructure/api/scoreboard-api'
import { pageOrigin } from '@/infrastructure/browser'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Icon } from '@/presentation/components/icon'
import { LinkText } from '@/presentation/components/link-text'
import { Input, Label, TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-context'
import { RichText } from '@/presentation/i18n/rich-text'

import { ChoiceField } from './choice-field'

/** The choice that shows every table, beside the event's own displays. */
const ALL_TABLES = 'all'

type WallPairingFormProps = {
  code: OrganiserCode
  eventId: EventId
  /** The code a scanned screen handed over, typed in already. */
  scannedCode: WallPairingCode | null
  setup: EventSetup
}

type Outcome =
  | { status: 'idle' }
  | { status: 'sending' }
  | { error: ClaimWallError; status: 'failed' }
  | { name: string; status: 'paired' }

/** Puts a screen waiting on `/wall` onto this event, on every table or on one of its displays. */
export const WallPairingForm: React.FC<WallPairingFormProps> = ({
  code,
  eventId,
  scannedCode,
  setup
}) => {
  const translate = useTranslate()
  const [typed, setTyped] = useState(scannedCode ?? '')
  const [displayChoice, setDisplayChoice] = useState(ALL_TABLES)
  const [outcome, setOutcome] = useState<Outcome>({ status: 'idle' })
  const pairingCode = parseWallPairingCode(typed)
  const choices = [
    { id: ALL_TABLES, label: translate('organiser.displays.all') },
    ...setup.displays.map((display) => ({
      id: display.id,
      label: display.name
    }))
  ]
  const wallUrl = `${pageOrigin()}${PAGE_ROUTES.wall}`

  return (
    <Form
      className='organiser-panel organiser-inline-form'
      onSubmit={async (event) => {
        event.preventDefault()

        if (pairingCode === null) {
          return
        }

        const display = setup.displays.find(({ id }) => id === displayChoice)
        setOutcome({ status: 'sending' })
        const claimed = await claimWallPairing(pairingCode, {
          displayId: display?.id ?? null,
          eventId,
          organiserCode: code
        })

        if (claimed.status === 'failure') {
          setOutcome({ error: claimed.error, status: 'failed' })

          return
        }

        setTyped('')
        setOutcome({
          name: display?.name ?? translate('organiser.displays.all'),
          status: 'paired'
        })
      }}
    >
      <h3>{translate('organiser.displays.pair.title')}</h3>
      <p className='organiser-note'>
        <RichText
          parts={translate.rich('organiser.displays.pair.explain', {
            link: (children: string) => <LinkText url={children} />,
            url: wallUrl
          })}
        />
      </p>
      <TextField
        isRequired
        onChange={(value) => {
          setTyped(value)
          setOutcome({ status: 'idle' })
        }}
        value={typed}
      >
        <Label>{translate('organiser.displays.pair.code')}</Label>
        <Input
          autoCapitalize='characters'
          autoComplete='off'
          className='organiser-code-input'
        />
      </TextField>
      {setup.displays.length === 0 ? null : (
        <ChoiceField
          choices={choices}
          label={translate('organiser.displays.pair.which')}
          onChange={(id) => setDisplayChoice(id ?? ALL_TABLES)}
          selectedId={displayChoice}
        />
      )}
      <Button
        isDisabled={pairingCode === null || outcome.status === 'sending'}
        type='submit'
      >
        <Icon name='display' />
        {translate('organiser.displays.pair.submit')}
      </Button>
      {outcome.status === 'failed' ? (
        <p className='organiser-alert' role='alert'>
          <Icon name='alert' />
          {translate(`organiser.displays.pair.error.${outcome.error}`)}
        </p>
      ) : null}
      {outcome.status === 'paired' ? (
        <p className='organiser-note' role='status'>
          <Icon name='check' />
          {translate('organiser.displays.pair.done', { name: outcome.name })}
        </p>
      ) : null}
    </Form>
  )
}
