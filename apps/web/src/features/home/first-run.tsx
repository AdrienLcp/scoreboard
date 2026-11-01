import type React from 'react'
import { useState } from 'react'

import { type ClubCode, clubCodeSchema } from '@scoreboard/protocol/club-record'

import { Button } from '@/presentation/components/button'
import {
  Disclosure,
  DisclosurePanel
} from '@/presentation/components/disclosure'
import { Form } from '@/presentation/components/form'
import { Icon } from '@/presentation/components/icon'
import { Input, Label, TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-context'

type FirstRunProps = {
  onCreate: (name: string) => Promise<boolean>
  onJoin: (code: ClubCode) => void
}

/** No club on this device yet: its name is the one thing asked; a club opened elsewhere comes by its code. */
export const FirstRun: React.FC<FirstRunProps> = ({ onCreate, onJoin }) => {
  const translate = useTranslate()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isRefused, setIsRefused] = useState(false)
  const typedCode = clubCodeSchema.safeParse(
    code.replace(/[\s-]/g, '').toUpperCase()
  )

  return (
    <section aria-labelledby='first-run-title' className='first-run'>
      <h1 className='home-hero' id='first-run-title'>
        {translate('home.headline')}
      </h1>
      <Form
        className='first-run-form'
        onSubmit={async (event) => {
          event.preventDefault()
          setIsCreating(true)
          setIsRefused(!(await onCreate(name.trim())))
          setIsCreating(false)
        }}
      >
        <div className='home-inline-field'>
          <TextField isRequired onChange={setName} value={name}>
            <Label>{translate('home.firstRun.name')}</Label>
            <Input
              autoComplete='organization'
              placeholder={translate('home.firstRun.namePlaceholder')}
            />
          </TextField>
          <Button isPending={isCreating} type='submit' variant='primary'>
            {translate('home.firstRun.create')}
            <Icon name='arrowRight' />
          </Button>
        </div>
        {isRefused ? (
          <p className='home-alert' role='alert'>
            <Icon name='wifiOff' />
            {translate('club.offline')}
          </p>
        ) : null}
      </Form>
      <Disclosure className='first-run-join'>
        <p className='home-hint'>{translate('home.firstRun.known')}</p>
        <Button
          className='first-run-join-trigger'
          slot='trigger'
          variant='quiet'
        >
          <Icon name='qr' />
          {translate('home.firstRun.joinTitle')}
          <Icon name='chevronDown' />
        </Button>
        <DisclosurePanel>
          <Form
            className='first-run-code'
            onSubmit={(event) => {
              event.preventDefault()

              if (typedCode.success) {
                onJoin(typedCode.data)
              }
            }}
          >
            <p className='home-hint'>{translate('home.firstRun.joinHelp')}</p>
            <div className='home-inline-field'>
              <TextField onChange={setCode} value={code}>
                <Label>{translate('home.firstRun.code')}</Label>
                <Input
                  autoCapitalize='characters'
                  autoComplete='off'
                  className='first-run-code-input'
                  spellCheck={false}
                />
              </TextField>
              <Button isDisabled={!typedCode.success} type='submit'>
                {translate('home.firstRun.join')}
              </Button>
            </div>
          </Form>
        </DisclosurePanel>
      </Disclosure>
    </section>
  )
}
