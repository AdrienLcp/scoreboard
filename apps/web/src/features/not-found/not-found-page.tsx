import type React from 'react'

import { paths, useCurrentPath } from '@/infrastructure/router/navigation'
import { Link } from '@/presentation/components/link'
import { Main } from '@/presentation/components/main'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

/** Names the address no route owns rather than sending home in silence. */
export const NotFoundPage: React.FC = () => {
  const translate = useTranslate()
  const pathname = useCurrentPath()

  return (
    <Main>
      <title>{translate('notFound.title')}</title>
      <h1>{translate('notFound.title')}</h1>
      <p>{translate('notFound.address', { path: pathname })}</p>
      <Link href={paths.home}>{translate('notFound.home')}</Link>
    </Main>
  )
}
