import type React from 'react'
import { useState } from 'react'

import {
  type ClubRecord,
  clubCodeSchema,
  type DirectoryClub
} from '@scoreboard/protocol/club-record'

import { newDirectoryClubId, newTeamId } from '@/infrastructure/ids'
import { paths } from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
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

import { addOpponentClub, addTeam, removeOpponentClub } from './club-edits'
import { LicenseeList } from './licensee-list'
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

/** No club on this device yet: open one, or find it again by its code. */
const ClubWelcome: React.FC<{
  onCreate: (name: string) => Promise<boolean>
  onJoin: (code: string) => void
}> = ({ onCreate, onJoin }) => {
  const translate = useTranslate()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [isRefused, setIsRefused] = useState(false)
  const typedCode = code.replace(/[\s-]/g, '').toUpperCase()
  const isCodeComplete = clubCodeSchema.safeParse(typedCode).success

  return (
    <div className='club-welcome'>
      <Form
        className='club-panel'
        onSubmit={async (event) => {
          event.preventDefault()
          setIsRefused(!(await onCreate(name.trim())))
        }}
      >
        <h2 className='club-heading'>
          {translate('club.welcome.createTitle')}
        </h2>
        <p className='club-note'>{translate('club.welcome.createHelp')}</p>
        <TextField onChange={setName} value={name}>
          <Label>{translate('club.welcome.name')}</Label>
          <Input autoComplete='organization' />
        </TextField>
        {isRefused ? (
          <p className='club-alert' role='alert'>
            <Icon name='alert' />
            {translate('club.offline')}
          </p>
        ) : null}
        <Button isDisabled={name.trim() === ''} type='submit' variant='primary'>
          {translate('club.welcome.create')}
        </Button>
      </Form>
      <Form
        className='club-panel'
        onSubmit={(event) => {
          event.preventDefault()

          if (isCodeComplete) {
            onJoin(typedCode)
          }
        }}
      >
        <h2 className='club-heading'>{translate('club.welcome.joinTitle')}</h2>
        <p className='club-note'>{translate('club.welcome.joinHelp')}</p>
        <TextField onChange={setCode} value={code}>
          <Label>{translate('club.code')}</Label>
          <Input
            autoCapitalize='characters'
            autoComplete='off'
            className='club-code-input'
          />
        </TextField>
        <Button isDisabled={!isCodeComplete} type='submit'>
          {translate('club.welcome.join')}
        </Button>
      </Form>
    </div>
  )
}

const groupedCode = (code: string): string =>
  code.match(/.{1,4}/g)?.join(' ') ?? code

/**
 * The club's own store: its teams with their colours, formats and tables, its
 * licensees, and the clubs it meets. Prepared once, picked from on every Sunday.
 */
export const ClubPage: React.FC = () => {
  const translate = useTranslate()
  const club = useClub()
  const { state } = club

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
          <h1 className='club-title'>{translate('club.title')}</h1>
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
            <h1 className='club-title'>{state.record.own.name}</h1>
            <p className='club-code'>
              <span className='club-label'>{translate('club.code')}</span>
              <span className='club-code-value'>{groupedCode(state.code)}</span>
            </p>
            <p className='club-note'>{translate('club.codeHelp')}</p>
            {state.isUnsaved ? (
              <p className='club-alert' role='alert'>
                <Icon name='wifiOff' />
                {translate('club.unsaved')}
              </p>
            ) : null}
          </div>
          <section className='club-section'>
            <ClubTeamsAndPlayers
              club={state.record.own}
              isOwn
              onChange={club.change}
              record={state.record}
            />
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
