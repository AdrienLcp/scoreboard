import type React from 'react'

import { paths, useCurrentPath } from '@/infrastructure/router/navigation'
import { ButtonLink } from '@/presentation/components/link'
import { MessagePage } from '@/presentation/components/message-page'
import { useTranslate } from '@/presentation/i18n/i18n-context'

/** Names the address no route owns rather than sending home in silence. */
export const NotFoundPage: React.FC = () => {
  const translate = useTranslate()
  const pathname = useCurrentPath()

  return (
    <MessagePage
      detail={translate('notFound.address', { path: pathname })}
      title={translate('notFound.title')}
    >
      <ButtonLink href={paths.home} variant='primary'>
        {translate('notFound.home')}
      </ButtonLink>
    </MessagePage>
  )
}
