import type React from 'react'

import { Link } from '@/presentation/components/link'
import { Main } from '@/presentation/components/main'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { paths, useRouteFailure } from './navigation'

/** Replaces the whole app when a route throws; its link reloads, which clears a half-broken state. */
export const ErrorScreen: React.FC = () => {
  const translate = useTranslate()
  const failure = useRouteFailure()

  return (
    <Main>
      <h1>{translate('error.screen.title')}</h1>
      <p>{failure}</p>
      <Link href={paths.home}>{translate('error.screen.home')}</Link>
    </Main>
  )
}
