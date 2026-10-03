import type React from 'react'

import type { InstantMs } from '@scoreboard/protocol/scoring-event'

import type { EncounterLine } from '@/features/event/encounter-lines'
import { toDate } from '@/infrastructure/dates'
import { QrCode } from '@/presentation/components/qr-code'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { RichText } from '@/presentation/i18n/rich-text'

import './waiting-stage.sass'

type WaitingStageProps = {
  encounters: readonly EncounterLine[]
  firstStartMs: InstantMs | null
  spectatorUrl: string
  tableCount: number
}

const lit = (children: string): React.ReactNode => <span>{children}</span>

/** Before the first match: when it starts, on how many tables, and the code to follow it all. */
export const WaitingStage: React.FC<WaitingStageProps> = ({
  encounters,
  firstStartMs,
  spectatorUrl,
  tableCount
}) => {
  const translate = useTranslate()

  return (
    <div className='waiting-stage'>
      <div className='waiting-main'>
        <p className='waiting-lead'>{translate('display.waiting.lead')}</p>
        <h2 className='waiting-time'>
          {firstStartMs === null ? (
            translate('display.waiting.soon')
          ) : (
            <RichText
              parts={translate.rich('display.waiting.firstAt', {
                at: toDate(firstStartMs),
                lit
              })}
            />
          )}
        </h2>
        <p className='waiting-meta'>
          {[
            translate('display.waiting.tables', { count: tableCount }),
            encounters.length === 0
              ? null
              : translate('display.waiting.encounters', {
                  count: encounters.length
                })
          ]
            .filter((part) => part !== null)
            .join(' · ')}
        </p>
        {encounters.length === 0 ? null : (
          <ul className='waiting-encounters'>
            {encounters.map((encounter) => (
              <li key={encounter.id}>
                <p className='waiting-encounter-meta'>
                  {encounter.tables.length === 0
                    ? translate('encounter.noTable')
                    : translate('encounter.tables', {
                        count: encounter.tables.length,
                        tables: encounter.tables.map(String)
                      })}
                </p>
                <p className='waiting-team'>{encounter.homeName}</p>
                <p className='waiting-team'>
                  <small>{translate('encounter.versus')}</small>
                  {encounter.awayName}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <aside className='waiting-qr'>
        <QrCode label={translate('display.qrLabel')} url={spectatorUrl} />
        <p>{translate('display.follow')}</p>
        <small>{spectatorUrl.replace(/^https?:\/\//, '')}</small>
      </aside>
    </div>
  )
}
