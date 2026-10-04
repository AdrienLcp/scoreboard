import type React from 'react'

import { TextLink } from '@/presentation/components/link'
import { MessagePage } from '@/presentation/components/message-page'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { paths, useRouteFailure } from './navigation'

/**
 * Replaces the whole app when a route throws. It sits outside the router, so
 * its link reloads the page, which also clears a half-broken state.
 */
export const ErrorScreen: React.FC = () => {
  const translate = useTranslate()
  const failure = useRouteFailure()

  return (
    <MessagePage detail={failure} title={translate('error.screen.title')}>
      <TextLink href={paths.home}>{translate('error.screen.home')}</TextLink>
    </MessagePage>
  )
}
