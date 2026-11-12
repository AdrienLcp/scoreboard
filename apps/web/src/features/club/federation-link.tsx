import type React from 'react'
import { useState } from 'react'

import type { DirectoryClub } from '@scoreboard/protocol/club-record'
import type { FederationClubNumber } from '@scoreboard/protocol/federation'

import { useClubTranslate } from '@/features/club/use-club-translate'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { Input, Label, TextField } from '@/presentation/components/text-field'

import {
  CLUB_SEARCH_MIN_LENGTH,
  useFederationClubSearch
} from './federation-queries'

import './federation-link.sass'
import './pick-field.sass'

const STEM_LENGTH = 4

/**
 * What the search starts from: the longest word of the name the club was
 * opened with, cut to its first letters, since a club's federal name rarely
 * reads like its everyday one ("PPC Angles" is "PING PONG CLUB ANGLOIS").
 */
const firstQueryOf = (name: string): string => {
  const longest = name
    .split(/[\s'’-]+/)
    .reduce((best, word) => (word.length > best.length ? word : best), '')

  return longest.length > STEM_LENGTH ? longest.slice(0, STEM_LENGTH) : longest
}

type FederationLinkProps = {
  club: DirectoryClub
  isOwn: boolean
  onLink: (number: FederationClubNumber) => void
}

/**
 * Finds a club of the directory at the FFTT, the search already run on its
 * name: one tap on the right line ties them, and its licensees follow. Says
 * nothing at all on a server without FFTT credentials.
 */
export const FederationLink: React.FC<FederationLinkProps> = ({
  club,
  isOwn,
  onLink
}) => {
  const translate = useClubTranslate()
  const [typed, setTyped] = useState(() => firstQueryOf(club.name))
  const search = useFederationClubSearch(typed)

  if (search?.status === 'off') {
    return null
  }

  const resultOf = () => {
    if (search === null) {
      return null
    }

    switch (search.status) {
      case 'loading':
        return (
          <p aria-live='polite' className='federation-link-note'>
            <Icon name='sync' />
            {translate('club.federation.searching')}
          </p>
        )
      case 'offline':
        return (
          <p className='federation-link-alert' role='alert'>
            <Icon name='wifiOff' />
            {translate('club.federation.offline')}
          </p>
        )
      case 'down':
        return (
          <p className='federation-link-alert' role='alert'>
            <Icon name='alert' />
            {translate('club.federation.down')}
          </p>
        )
      case 'ready':
        return search.data.length === 0 ? (
          <p className='federation-link-note'>
            {translate('club.federation.noClub', { typed: typed.trim() })}
          </p>
        ) : (
          <div className='federation-link-hits'>
            {search.data.map((hit) => (
              <Button
                className='federation-link-hit'
                key={hit.number}
                onPress={() => onLink(hit.number)}
                variant='quiet'
              >
                <span className='federation-link-name'>{hit.name}</span>
                <span className='federation-link-number'>{hit.number}</span>
                <Icon name='arrowRight' />
              </Button>
            ))}
          </div>
        )
    }
  }

  return (
    <section className='federation-link'>
      <h2 className='federation-link-question'>
        {isOwn
          ? translate('club.federation.ourQuestion')
          : translate('club.federation.theirQuestion', { club: club.name })}
      </h2>
      <TextField
        className='federation-link-search'
        minLength={CLUB_SEARCH_MIN_LENGTH}
        onChange={setTyped}
        value={typed}
      >
        <Label>{translate('club.federation.searchLabel')}</Label>
        <div className='pick-field-box'>
          <Icon name='search' />
          <Input autoComplete='off' className='field-input pick-field-input' />
        </div>
      </TextField>
      {resultOf()}
      {search?.status === 'ready' && search.data.length > 0 ? (
        <p className='federation-link-why'>
          {translate('club.federation.why')}
        </p>
      ) : null}
    </section>
  )
}

type FederationTagProps = {
  number: FederationClubNumber
  onUnlink: () => void
}

/** The FFTT number a club is tied to, and the way to untie it. */
export const FederationTag: React.FC<FederationTagProps> = ({
  number,
  onUnlink
}) => {
  const translate = useClubTranslate()

  return (
    <p className='federation-tag'>
      <span className='federation-tag-source'>FFTT</span>
      <span className='federation-tag-number'>{number}</span>
      <Button
        aria-label={translate('club.federation.unlink')}
        className='federation-tag-unlink'
        onPress={onUnlink}
        variant='quiet'
      >
        <Icon name='close' />
      </Button>
    </p>
  )
}
