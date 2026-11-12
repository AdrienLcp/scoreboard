import type React from 'react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type {
  EventId,
  OrganiserCode,
  WallPairingCode
} from '@scoreboard/protocol/identifiers'
import { PAGE_ROUTES } from '@scoreboard/protocol/page-routes'

import { parseWallPairingCode } from '@scoreboard/core/access/access-codes'

import { useClubTranslate } from '@/features/club/use-club-translate'
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

/**
 * Puts a screen waiting on `/wall` onto this event, on every table or on one
 * of its displays. A scanned screen with nothing to choose is put on every
 * table at once: the organiser only reads the confirmation.
 */
export const WallPairingForm: React.FC<WallPairingFormProps> = ({
  code,
  eventId,
  scannedCode,
  setup
}) => {
  const translate = useClubTranslate()
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

  const claim = async (claimed: WallPairingCode, choice: string) => {
    const display = setup.displays.find(({ id }) => id === choice)
    setOutcome({ status: 'sending' })
    const sent = await claimWallPairing(claimed, {
      displayId: display?.id ?? null,
      eventId,
      organiserCode: code
    })

    if (sent.status === 'failure') {
      setOutcome({ error: sent.error, status: 'failed' })

      return
    }

    setTyped('')
    setOutcome({
      name: display?.name ?? translate('organiser.displays.all'),
      status: 'paired'
    })
  }
  const claimScanned = useEffectEvent(claim)
  const hasClaimedScanned = useRef(false)
  const hasNothingToChoose = setup.displays.length === 0

  useEffect(() => {
    if (
      scannedCode === null ||
      !hasNothingToChoose ||
      hasClaimedScanned.current
    ) {
      return
    }

    hasClaimedScanned.current = true
    void claimScanned(scannedCode, ALL_TABLES)
  }, [hasNothingToChoose, scannedCode])

  return (
    <Form
      className='organiser-panel organiser-inline-form'
      onSubmit={(event) => {
        event.preventDefault()

        if (pairingCode !== null) {
          void claim(pairingCode, displayChoice)
        }
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
        <p className='organiser-done' role='status'>
          <Icon name='check' />
          {translate('organiser.displays.pair.done', { name: outcome.name })}
        </p>
      ) : null}
    </Form>
  )
}
