import type React from 'react'

import { paths } from '@/infrastructure/router/navigation'
import { BrandMark } from '@/presentation/components/brand-mark'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink, Link } from '@/presentation/components/link'
import { Main } from '@/presentation/components/main'
import { DocumentTitle } from '@/presentation/head/document-title'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { DemoWall } from './demo-wall'
import { useDemoSnapshot } from './use-demo-day'

import './demo-page.sass'

/**
 * The hall's TV on a fictional club's team day that plays itself, under a
 * bar that says so and leads to the two next steps.
 */
export const DemoPage: React.FC = () => {
  const translate = useTranslate()
  const { nowMs, snapshot } = useDemoSnapshot()

  return (
    <Main className='demo-page'>
      <DocumentTitle>{translate('demo.title')}</DocumentTitle>
      <header className='demo-bar'>
        <Link
          aria-label={translate('guide.back')}
          className='demo-home'
          href={paths.home}
        >
          <BrandMark />
        </Link>
        <p className='demo-what'>
          <span aria-hidden='true' className='demo-live' />
          {translate('demo.what')}
        </p>
        <div className='demo-actions'>
          <ButtonLink href={paths.guide} variant='quiet'>
            <Icon name='guide' />
            {translate('home.guide')}
          </ButtonLink>
          <ButtonLink href={paths.home} variant='primary'>
            {translate('demo.create')}
            <Icon name='arrowRight' />
          </ButtonLink>
        </div>
      </header>
      <DemoWall className='demo-wall' nowMs={nowMs} snapshot={snapshot} />
    </Main>
  )
}
