import type React from 'react'

import { paths } from '@/infrastructure/router/navigation'
import { TextLink } from '@/presentation/components/link'
import {
  AUTHOR,
  SOURCE_REPOSITORY_HREF
} from '@/presentation/components/site-credits'
import { useTranslate } from '@/presentation/i18n/i18n-context'
import { RichText } from '@/presentation/i18n/rich-text'

import './site-footer.sass'

const authorLink = (children: string): React.ReactNode => (
  <TextLink href={AUTHOR.siteHref}>{children}</TextLink>
)

/**
 * The foot of every page: who made the app, linked to his site, its source
 * when public, and the legal page the law requires.
 */
export const SiteFooter: React.FC = () => {
  const translate = useTranslate()

  return (
    <footer className='site-footer'>
      <p>
        <RichText
          parts={translate.rich('shell.footer.credit', {
            author: authorLink,
            name: AUTHOR.name
          })}
        />
      </p>
      {SOURCE_REPOSITORY_HREF !== null && (
        <TextLink href={SOURCE_REPOSITORY_HREF}>
          {translate('shell.footer.source')}
        </TextLink>
      )}
      <TextLink href={paths.legal}>{translate('shell.footer.legal')}</TextLink>
    </footer>
  )
}
