import type React from 'react'
import { useState } from 'react'

import { parseUmpireCode } from '@scoreboard/core/access/access-codes'

import {
  umpirePathFor,
  useEventIdParam,
  useNavigateTo
} from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Main } from '@/presentation/components/main'
import {
  FieldError,
  Input,
  Label,
  TextField
} from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

/** Where an umpire without the table's QR code types its code instead. */
export const UmpireEntryPage: React.FC = () => {
  const translate = useTranslate()
  const eventId = useEventIdParam()
  const navigateTo = useNavigateTo()
  const [typed, setTyped] = useState('')
  const code = parseUmpireCode(typed)

  return (
    <Main>
      <title>{translate('umpire.entry.title')}</title>
      <h1>{translate('umpire.entry.title')}</h1>
      <Form
        onSubmit={(event) => {
          event.preventDefault()

          if (eventId !== null && code !== null) {
            navigateTo(umpirePathFor({ code, eventId }))
          }
        }}
      >
        <TextField
          isInvalid={typed !== '' && code === null}
          isRequired
          onChange={setTyped}
          value={typed}
        >
          <Label>{translate('umpire.entry.code')}</Label>
          <Input autoCapitalize='characters' autoComplete='off' />
          <FieldError>{translate('umpire.entry.invalid')}</FieldError>
        </TextField>
        <Button isDisabled={code === null || eventId === null} type='submit'>
          {translate('umpire.entry.submit')}
        </Button>
      </Form>
    </Main>
  )
}
