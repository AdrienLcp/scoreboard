import type React from 'react'
import { useId } from 'react'

import { useClub } from '@/features/club/use-club'
import { paths } from '@/infrastructure/router/navigation'
import { BrandMark } from '@/presentation/components/brand-mark'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink, Link } from '@/presentation/components/link'
import { Main } from '@/presentation/components/main'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-context'
import { RichText } from '@/presentation/i18n/rich-text'

import './guide-page.sass'

const bold = (children: string): React.ReactNode => <strong>{children}</strong>

type GuideStepProps = {
  aside?: React.ReactNode
  body: React.ReactNode
  figure: number
  title: string
}

const GuideStep: React.FC<GuideStepProps> = ({
  aside,
  body,
  figure,
  title
}) => {
  const titleId = useId()

  return (
    <li aria-labelledby={titleId} className='guide-step'>
      <span aria-hidden='true' className='guide-step-figure'>
        {figure}
      </span>
      <div className='guide-step-body'>
        <h2 id={titleId}>{title}</h2>
        <p>{body}</p>
        {aside === undefined ? null : <p className='guide-aside'>{aside}</p>}
      </div>
    </li>
  )
}

/**
 * How a club day runs with the app, in the four steps an organiser walks
 * once: the club, the day, the hall's TV, the umpires and the room. Read on
 * a phone, sent as a link, or printed for the volunteers.
 */
export const GuidePage: React.FC = () => {
  const translate = useTranslate()
  const { state } = useClub()
  const hasNoClub = state.status === 'none'
  const rich = (
    key:
      | 'guide.steps.club.aside'
      | 'guide.steps.club.body'
      | 'guide.steps.day.aside'
      | 'guide.steps.day.body'
      | 'guide.steps.room.body'
  ) => <RichText parts={translate.rich(key, { b: bold })} />

  return (
    <Main className='guide-page'>
      <DocumentTitle>{translate('guide.title')}</DocumentTitle>
      <header className='guide-bar'>
        <Link
          aria-label={translate('guide.back')}
          className='guide-home'
          href={paths.home}
        >
          <BrandMark />
        </Link>
      </header>
      <div className='guide-document'>
        <h1 className='guide-title'>{translate('guide.title')}</h1>
        <p className='guide-lead'>{translate('guide.lead')}</p>
        <ol className='guide-steps'>
          <GuideStep
            aside={rich('guide.steps.club.aside')}
            body={rich('guide.steps.club.body')}
            figure={1}
            title={translate('guide.steps.club.title')}
          />
          <GuideStep
            aside={rich('guide.steps.day.aside')}
            body={rich('guide.steps.day.body')}
            figure={2}
            title={translate('guide.steps.day.title')}
          />
          <GuideStep
            body={
              <RichText
                parts={translate.rich('guide.steps.screen.body', {
                  b: bold,
                  site: window.location.host
                })}
              />
            }
            figure={3}
            title={translate('guide.steps.screen.title')}
          />
          <GuideStep
            aside={translate('guide.steps.room.aside')}
            body={rich('guide.steps.room.body')}
            figure={4}
            title={translate('guide.steps.room.title')}
          />
        </ol>
        <div className='guide-close'>
          {hasNoClub ? (
            <ButtonLink href={paths.home} variant='primary'>
              {translate('guide.create')}
              <Icon name='arrowRight' />
            </ButtonLink>
          ) : (
            <ButtonLink href={paths.home} variant='primary'>
              <Icon name='home' />
              {translate('guide.back')}
            </ButtonLink>
          )}
          <ButtonLink href={paths.demo}>
            <Icon name='display' />
            {translate('guide.demo')}
          </ButtonLink>
          <Button onPress={() => window.print()} variant='quiet'>
            <Icon name='print' />
            {translate('guide.print')}
          </Button>
        </div>
      </div>
    </Main>
  )
}
