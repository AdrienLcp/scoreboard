import type React from 'react'
import { useEffect, useState } from 'react'

import {
  type ClubCode,
  type ClubRecord,
  clubCodeSchema,
  type DirectoryClub
} from '@scoreboard/protocol/club-record'

import { pageOrigin } from '@/infrastructure/browser'
import { newDirectoryClubId, newTeamId } from '@/infrastructure/ids'
import {
  clubJoinPathFor,
  paths,
  useClubCodeSearchParam,
  useReplaceWith
} from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { CodeAndQr } from '@/presentation/components/code-and-qr'
import {
  Disclosure,
  DisclosurePanel
} from '@/presentation/components/disclosure'
import { Form } from '@/presentation/components/form'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink } from '@/presentation/components/link'
import { Main } from '@/presentation/components/main'
import { Input, Label, TextField } from '@/presentation/components/text-field'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import {
  addOpponentClub,
  addTeam,
  changeClubLogo,
  removeOpponentClub
} from './club-edits'
import { ClubHallPlan } from './club-hall-plan'
import { LicenseeList } from './licensee-list'
import { LogoPicker } from './logo-picker'
import { TeamEditor } from './team-editor'
import { useClub } from './use-club'

import './club-page.sass'

type ClubSectionProps = {
  club: DirectoryClub
  isOwn: boolean
  onChange: (record: ClubRecord) => void
  record: ClubRecord
}

/** A club's teams then its players: ours open the page, each opponent folds into its own block. */
const ClubTeamsAndPlayers: React.FC<ClubSectionProps> = ({
  club,
  isOwn,
  onChange,
  record
}) => {
  const translate = useTranslate()

  return (
    <>
      <div className='club-block'>
        <h3 className='club-label'>{translate('club.teams.title')}</h3>
        {club.teams.length === 0 ? (
          <p className='club-empty'>{translate('club.teams.empty')}</p>
        ) : (
          club.teams.map((team) => (
            <TeamEditor
              club={club}
              isOwn={isOwn}
              key={team.id}
              onChange={onChange}
              record={record}
              team={team}
            />
          ))
        )}
        <Button
          onPress={() =>
            onChange(addTeam({ clubId: club.id, newTeamId, record }))
          }
        >
          <Icon name='plus' />
          {translate('club.teams.add')}
        </Button>
      </div>
      <div className='club-block'>
        <h3 className='club-label'>{translate('club.players.title')}</h3>
        <LicenseeList club={club} onChange={onChange} record={record} />
      </div>
    </>
  )
}

const OpponentClubForm: React.FC<{
  onChange: (record: ClubRecord) => void
  record: ClubRecord
}> = ({ onChange, record }) => {
  const translate = useTranslate()
  const [name, setName] = useState('')

  return (
    <Form
      className='club-inline-form'
      onSubmit={(event) => {
        event.preventDefault()

        if (name.trim() === '') {
          return
        }

        onChange(
          addOpponentClub({
            name: name.trim(),
            newClubId: newDirectoryClubId,
            record
          })
        )
        setName('')
      }}
    >
      <TextField onChange={setName} value={name}>
        <Label>{translate('club.opponents.name')}</Label>
        <Input autoComplete='off' />
      </TextField>
      <Button isDisabled={name.trim() === ''} type='submit'>
        <Icon name='plus' />
        {translate('club.opponents.add')}
      </Button>
    </Form>
  )
}

/** No club here yet: its name is the one thing asked; a club opened elsewhere comes by its code. */
const ClubWelcome: React.FC<{
  onCreate: (name: string) => Promise<boolean>
  onJoin: (code: ClubCode) => void
}> = ({ onCreate, onJoin }) => {
  const translate = useTranslate()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [isRefused, setIsRefused] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const typedCode = clubCodeSchema.safeParse(
    code.replace(/[\s-]/g, '').toUpperCase()
  )

  return (
    <div className='club-welcome'>
      <Form
        className='club-panel'
        onSubmit={async (event) => {
          event.preventDefault()
          setIsCreating(true)
          setIsRefused(!(await onCreate(name.trim())))
          setIsCreating(false)
        }}
      >
        <p className='club-note'>{translate('club.welcome.createHelp')}</p>
        <TextField onChange={setName} value={name}>
          <Label>{translate('club.welcome.name')}</Label>
          <Input
            autoComplete='organization'
            placeholder={translate('club.welcome.namePlaceholder')}
          />
        </TextField>
        {isRefused ? (
          <p className='club-alert' role='alert'>
            <Icon name='alert' />
            {translate('club.offline')}
          </p>
        ) : null}
        <Button
          isDisabled={name.trim() === ''}
          isPending={isCreating}
          type='submit'
          variant='primary'
        >
          {translate('club.welcome.create')}
        </Button>
      </Form>
      <Disclosure className='club-join'>
        <Button className='club-join-trigger' slot='trigger' variant='quiet'>
          <Icon name='qr' />
          {translate('club.welcome.joinTitle')}
          <Icon name='chevronDown' />
        </Button>
        <DisclosurePanel>
          <Form
            className='club-panel'
            onSubmit={(event) => {
              event.preventDefault()

              if (typedCode.success) {
                onJoin(typedCode.data)
              }
            }}
          >
            <p className='club-note'>{translate('club.welcome.joinHelp')}</p>
            <TextField onChange={setCode} value={code}>
              <Label>{translate('club.code')}</Label>
              <Input
                autoCapitalize='characters'
                autoComplete='off'
                className='club-code-input'
                spellCheck={false}
              />
            </TextField>
            <Button isDisabled={!typedCode.success} type='submit'>
              {translate('club.welcome.join')}
            </Button>
          </Form>
        </DisclosurePanel>
      </Disclosure>
    </div>
  )
}

const groupedCode = (code: string): string =>
  code.match(/.{1,4}/g)?.join(' ') ?? code

/** Another organiser's phone or the hall's laptop opens the same club by scanning, or by typing the code. */
const ClubShare: React.FC<{ code: ClubCode }> = ({ code }) => {
  const translate = useTranslate()

  return (
    <Disclosure className='club-share'>
      <Button className='club-share-trigger' slot='trigger' variant='quiet'>
        <Icon name='qr' />
        {translate('club.share.open')}
        <Icon name='chevronDown' />
      </Button>
      <DisclosurePanel>
        <div className='club-share-body'>
          <CodeAndQr
            code={groupedCode(code)}
            codeHint={translate('club.share.codeHint')}
            qrLabel={translate('club.share.qrLabel')}
            scanHint={translate('club.share.scanHint')}
            url={`${pageOrigin()}${clubJoinPathFor(code)}`}
          />
          <p className='club-note'>{translate('club.share.warning')}</p>
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}

/**
 * The club's own store: its teams with their colours, formats and tables, its
 * licensees, and the clubs it meets. Prepared once, picked from on every Sunday.
 */
export const ClubPage: React.FC = () => {
  const translate = useTranslate()
  const scannedCode = useClubCodeSearchParam()
  const replaceWith = useReplaceWith()
  const club = useClub(scannedCode)
  const { state } = club

  useEffect(() => {
    if (scannedCode !== null) {
      replaceWith(paths.club)
    }
  }, [replaceWith, scannedCode])

  const logoPickerOf = (target: DirectoryClub, children: React.ReactNode) => (
    <LogoPicker
      logoUrl={target.logoUrl}
      name={target.name}
      onPick={(file) => club.uploadLogo({ clubId: target.id, file })}
      onRemove={() =>
        club.edit((record) =>
          changeClubLogo({ clubId: target.id, logoUrl: null, record })
        )
      }
    >
      {children}
    </LogoPicker>
  )

  return (
    <Main className='club-page'>
      <DocumentTitle>{translate('club.title')}</DocumentTitle>
      <header className='club-bar'>
        <ButtonLink href={paths.home} variant='quiet'>
          <Icon name='arrowLeft' />
          {translate('club.home')}
        </ButtonLink>
        {state.status === 'ready' && state.previous !== null ? (
          <Button onPress={club.undo} variant='quiet'>
            <Icon name='undo' />
            {translate('club.undo')}
          </Button>
        ) : null}
      </header>
      {state.status === 'none' ? (
        <>
          <h1 className='club-title'>{translate('club.welcome.title')}</h1>
          <ClubWelcome onCreate={club.create} onJoin={club.join} />
        </>
      ) : null}
      {state.status === 'loading' ? (
        <p className='club-note'>{translate('club.loading')}</p>
      ) : null}
      {state.status === 'missing' || state.status === 'offline' ? (
        <div className='club-panel'>
          <p className='club-alert' role='alert'>
            <Icon name={state.status === 'offline' ? 'wifiOff' : 'alert'} />
            {translate(
              state.status === 'offline' ? 'club.offline' : 'club.missing'
            )}
          </p>
          <div className='club-actions'>
            <Button onPress={() => club.join(state.code)}>
              <Icon name='sync' />
              {translate('club.retry')}
            </Button>
            <Button onPress={club.forget} variant='quiet'>
              {translate('club.forget')}
            </Button>
          </div>
        </div>
      ) : null}
      {state.status === 'ready' ? (
        <>
          <div className='club-head'>
            {logoPickerOf(
              state.record.own,
              <h1 className='club-title'>{state.record.own.name}</h1>
            )}
            {state.isUnsaved ? (
              <p className='club-alert' role='alert'>
                <Icon name='wifiOff' />
                {translate('club.unsaved')}
              </p>
            ) : null}
            <ClubShare code={state.code} />
          </div>
          <section className='club-section'>
            <ClubTeamsAndPlayers
              club={state.record.own}
              isOwn
              onChange={club.change}
              record={state.record}
            />
          </section>
          <section className='club-hall-section'>
            <h2 className='club-heading'>{translate('club.hall.title')}</h2>
            {state.record.hall === null ? null : (
              <ClubHallPlan plan={state.record.hall} />
            )}
            <p className='club-note'>
              {translate(
                state.record.hall === null
                  ? 'club.hall.empty'
                  : 'club.hall.help'
              )}
            </p>
          </section>
          <section className='club-section'>
            <h2 className='club-heading'>
              {translate('club.opponents.title')}
            </h2>
            <p className='club-note'>{translate('club.opponents.help')}</p>
            {state.record.opponents.map((opponent) => (
              <Disclosure className='opponent-club' key={opponent.id}>
                <Button
                  className='team-editor-trigger'
                  slot='trigger'
                  variant='quiet'
                >
                  <span className='team-editor-name'>{opponent.name}</span>
                  <span className='team-editor-detail'>
                    {translate('club.opponents.summary', {
                      players: opponent.players.length,
                      teams: opponent.teams.length
                    })}
                  </span>
                  <Icon name='chevronDown' />
                </Button>
                <DisclosurePanel>
                  <div className='opponent-club-body'>
                    {logoPickerOf(
                      opponent,
                      <p className='club-label'>
                        {translate('club.logo.title')}
                      </p>
                    )}
                    <ClubTeamsAndPlayers
                      club={opponent}
                      isOwn={false}
                      onChange={club.change}
                      record={state.record}
                    />
                    <Button
                      onPress={() =>
                        club.change(
                          removeOpponentClub(state.record, opponent.id)
                        )
                      }
                      variant='quiet'
                    >
                      <Icon name='close' />
                      {translate('club.opponents.remove')}
                    </Button>
                  </div>
                </DisclosurePanel>
              </Disclosure>
            ))}
            <OpponentClubForm onChange={club.change} record={state.record} />
          </section>
        </>
      ) : null}
    </Main>
  )
}
