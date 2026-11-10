import type React from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-context'

import './federation-source.sass'

/** "Source : FFTT" under data read from the federation, as its terms of use ask. */
export const FederationSource: React.FC = () => {
  const translate = useTranslate()

  return (
    <p className='federation-source'>{translate('club.federation.source')}</p>
  )
}
