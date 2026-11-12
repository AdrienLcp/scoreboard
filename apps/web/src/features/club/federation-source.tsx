import type React from 'react'

import { useClubTranslate } from '@/features/club/use-club-translate'

import './federation-source.sass'

/** "Source : FFTT" under data read from the federation, as its terms of use ask. */
export const FederationSource: React.FC = () => {
  const translate = useClubTranslate()

  return (
    <p className='federation-source'>{translate('club.federation.source')}</p>
  )
}
