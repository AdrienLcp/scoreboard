import type React from 'react'

import type { ClubRecord } from '@scoreboard/protocol/club-record'

import { useClubTranslate } from '@/features/club/use-club-translate'
import { paths } from '@/infrastructure/router/navigation'
import { TextLink } from '@/presentation/components/link'
import { RichText } from '@/presentation/i18n/rich-text'

import { NewEventForm } from './new-event-form'

const clubLink = (children: string): React.ReactNode => (
  <TextLink href={paths.club}>{children}</TextLink>
)

/** No championship round to come: a new event is the page's main action, and the pools are where rounds come from. */
export const FreeDaySection: React.FC<{ record: ClubRecord }> = ({
  record
}) => {
  const translate = useClubTranslate()

  return (
    <section aria-labelledby='free-day-title' className='free-day'>
      <h1 className='home-hero' id='free-day-title'>
        {translate('home.free.title')}
      </h1>
      <p className='home-summary'>{translate('home.free.summary')}</p>
      <NewEventForm isMain record={record} />
      <p className='home-hint'>
        <RichText
          parts={translate.rich(
            record.pools.length === 0
              ? 'home.free.pools'
              : 'home.free.poolsDone',
            { link: clubLink }
          )}
        />
      </p>
    </section>
  )
}
