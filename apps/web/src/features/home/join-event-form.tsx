import type React from 'react'
import { useState } from 'react'

import { eventIdSchema } from '@scoreboard/protocol/identifiers'

import {
  spectatorPathFor,
  umpireEntryPathFor,
  useNavigateTo
} from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import {
  Disclosure,
  DisclosurePanel
} from '@/presentation/components/disclosure'
import { Form } from '@/presentation/components/form'
import { Icon } from '@/presentation/components/icon'
import {
  Description,
  FieldError,
  Input,
  Label,
  TextField
} from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-context'

/** An event link pasted whole works as well as its code alone. */
const eventCodeIn = (typed: string): string =>
  typed.trim().split('/e/').at(-1)?.split(/[/?#]/)[0]?.toLowerCase() ?? ''

/**
 * Umpires and spectators come by the QR code on a table or on the hall's TV;
 * the event's code, folded away, is for whoever has none at hand.
 */
export const JoinEventForm: React.FC = () => {
  const translate = useTranslate()
  const navigateTo = useNavigateTo()
  const [typed, setTyped] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const eventId = eventIdSchema.safeParse(eventCodeIn(typed))
  const goTo = (pathFor: (id: string) => string) => {
    setIsSubmitted(true)

    if (eventId.success) {
      navigateTo(pathFor(eventId.data))
    }
  }

  return (
    <section aria-labelledby='home-join-title' className='home-block'>
      <h2 id='home-join-title'>{translate('home.join.title')}</h2>
      <p className='home-hint'>{translate('home.join.scan')}</p>
      <Disclosure className='home-fold'>
        <Button className='home-fold-trigger' slot='trigger' variant='quiet'>
          {translate('home.join.open')}
          <Icon name='chevronDown' />
        </Button>
        <DisclosurePanel>
          <Form
            className='home-join'
            onSubmit={(event) => {
              event.preventDefault()
              goTo(spectatorPathFor)
            }}
          >
            <TextField
              isInvalid={isSubmitted && !eventId.success}
              onChange={(value) => {
                setTyped(value)
                setIsSubmitted(false)
              }}
              value={typed}
            >
              <Label>{translate('home.join.code')}</Label>
              <Input
                autoComplete='off'
                className='home-join-input'
                spellCheck={false}
              />
              <Description>{translate('home.join.hint')}</Description>
              <FieldError>
                <Icon name='alert' />
                {translate('home.join.invalid')}
              </FieldError>
            </TextField>
            <div className='home-join-actions'>
              <Button type='submit'>{translate('home.join.follow')}</Button>
              <Button onPress={() => goTo(umpireEntryPathFor)}>
                {translate('home.join.umpire')}
              </Button>
            </div>
          </Form>
        </DisclosurePanel>
      </Disclosure>
    </section>
  )
}
