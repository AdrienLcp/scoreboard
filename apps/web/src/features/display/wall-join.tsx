import type React from 'react'

import type { EventId } from '@scoreboard/protocol/identifiers'

import { LinkText } from '@/presentation/components/link-text'
import { QrCode } from '@/presentation/components/qr-code'
import { useTranslate } from '@/presentation/i18n/i18n-context'

/** A code read from across the hall breaks into groups of this many characters. */
const CODE_GROUP = 5

const codeGroupsOf = (eventId: EventId): string[] =>
  eventId.toUpperCase().match(new RegExp(`.{1,${CODE_GROUP}}`, 'g')) ?? []

type WallJoinProps = {
  eventId: EventId
  spectatorUrl: string
  /** Where it stands on the hall's plan, when the wall follows it. */
  style?: React.CSSProperties
}

/** The way onto the spectators' page from across the hall: the QR, the code and the link. */
export const WallJoin: React.FC<WallJoinProps> = ({
  eventId,
  spectatorUrl,
  style
}) => {
  const translate = useTranslate()

  return (
    <aside className='wall-join' style={style}>
      <QrCode label={translate('display.qrLabel')} url={spectatorUrl} />
      <div className='wall-join-words'>
        <h2>{translate('display.wall.follow')}</h2>
        <p>{translate('display.wall.scanOrType')}</p>
        <strong className='wall-code' translate='no'>
          {codeGroupsOf(eventId).map((group) => (
            <span key={group}>{group}</span>
          ))}
        </strong>
        <small>
          <LinkText url={spectatorUrl} />
        </small>
      </div>
    </aside>
  )
}
