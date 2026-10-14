import type React from 'react'

import { paths } from '@/infrastructure/router/navigation'
import { TextLink } from '@/presentation/components/link'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import './site-footer.sass'

/** The foot of every page, holding the link to the legal page the law requires. */
export const SiteFooter: React.FC = () => {
  const translate = useTranslate()

  return (
    <footer className='site-footer'>
      <TextLink href={paths.legal}>{translate('shell.footer.legal')}</TextLink>
    </footer>
  )
}
