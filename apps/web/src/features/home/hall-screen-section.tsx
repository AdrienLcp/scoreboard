import type React from 'react'

import { paths } from '@/infrastructure/router/navigation'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink } from '@/presentation/components/link'
import { useTranslate } from '@/presentation/i18n/i18n-context'

/** On a device with no club yet, the way to the hall's TV screen, said for the computer plugged into it. */
export const HallScreenSection: React.FC = () => {
  const translate = useTranslate()

  return (
    <section aria-labelledby='home-screen-title' className='home-block'>
      <h2 id='home-screen-title'>{translate('home.screen.title')}</h2>
      <p className='home-hint'>{translate('home.screen.hint')}</p>
      <ButtonLink className='home-block-action' href={paths.wall}>
        <Icon name='display' />
        {translate('home.screen.open')}
      </ButtonLink>
    </section>
  )
}
