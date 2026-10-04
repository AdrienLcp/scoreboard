import type React from 'react'
import { useState } from 'react'

import { UMPIRE_CODE_LENGTH } from '@scoreboard/protocol/identifiers'

import { parseUmpireCode } from '@scoreboard/core/access/access-codes'

import {
  umpirePathFor,
  useEventIdParam,
  useNavigateTo
} from '@/infrastructure/router/navigation'
import { BrandMark } from '@/presentation/components/brand-mark'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Icon } from '@/presentation/components/icon'
import { Main } from '@/presentation/components/main'
import {
  Description,
  FieldError,
  Input,
  Label,
  TextField
} from '@/presentation/components/text-field'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import './umpire-entry-page.sass'

/** Keeps what can be part of a code, so a typed space or dash never makes it wrong. */
const codeCharacters = (typed: string): string =>
  typed.toUpperCase().replace(/[^A-Z0-9]/g, '')

/** Where an umpire without the table's QR code types its code instead. */
export const UmpireEntryPage: React.FC = () => {
  const translate = useTranslate()
  const eventId = useEventIdParam()
  const navigateTo = useNavigateTo()
  const [typed, setTyped] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const code = parseUmpireCode(typed)
  const problem =
    typed === ''
      ? translate('umpire.entry.missing')
      : translate('umpire.entry.invalid')

  return (
    <Main className='umpire-entry'>
      <DocumentTitle>{translate('umpire.entry.title')}</DocumentTitle>
      <Form
        className='umpire-entry-form'
        onSubmit={(event) => {
          event.preventDefault()
          setIsSubmitted(true)

          if (eventId !== null && code !== null) {
            navigateTo(umpirePathFor({ code, eventId }))
          }
        }}
      >
        <BrandMark />
        <TextField
          autoFocus
          className='umpire-code-field'
          isInvalid={isSubmitted && code === null}
          onChange={(value) => {
            setTyped(codeCharacters(value))
            setIsSubmitted(false)
          }}
          value={typed}
        >
          <Label className='umpire-code-label'>
            {translate('umpire.entry.code')}
          </Label>
          <Description>{translate('umpire.entry.hint')}</Description>
          <Input
            autoCapitalize='characters'
            autoComplete='off'
            autoCorrect='off'
            className='umpire-code-input'
            maxLength={UMPIRE_CODE_LENGTH}
            placeholder={translate('umpire.entry.placeholder')}
            spellCheck={false}
          />
          <FieldError>
            <Icon name='alert' />
            {problem}
          </FieldError>
        </TextField>
        <Button type='submit' variant='primary'>
          {translate('umpire.entry.submit')}
        </Button>
        {eventId === null ? (
          <p className='umpire-entry-note' role='alert'>
            {translate('error.event_not_found')}
          </p>
        ) : null}
      </Form>
    </Main>
  )
}
