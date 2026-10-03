import type React from 'react'
import { useEffect, useRef, useState } from 'react'

import type { ConcessionReason } from '@scoreboard/protocol/scoring-event'
import { type Side, sides } from '@scoreboard/protocol/side'

import { opponentOf } from '@scoreboard/core/match/opponent'

import { prefersReducedMotion } from '@/infrastructure/browser'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import {
  ToggleButton,
  ToggleButtonGroup
} from '@/presentation/components/toggle-button-group'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './end-match-panel.sass'

type EndMatchPanelProps = {
  nameOf: (side: Side) => string
  onConcede: (concession: { by: Side; reason: ConcessionReason }) => void
}

const REASONS = [
  'retirement',
  'walkover'
] as const satisfies readonly ConcessionReason[]

const isSide = (key: unknown): key is Side => sides.some((side) => side === key)

const isReason = (key: unknown): key is ConcessionReason =>
  REASONS.some((reason) => reason === key)

/**
 * Ending a match before its score does: kept apart from the point targets and
 * behind two steps, who stops and why, then a confirmation naming the winner.
 */
export const EndMatchPanel: React.FC<EndMatchPanelProps> = ({
  nameOf,
  onConcede
}) => {
  const translate = useTranslate()
  const [isOpen, setIsOpen] = useState(false)
  const [by, setBy] = useState<Side | null>(null)
  const [reason, setReason] = useState<ConcessionReason>('retirement')
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (isOpen) {
      panelRef.current?.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'nearest'
      })
    }
  }, [isOpen])

  if (!isOpen) {
    return (
      <Button className='end-match-open' onPress={() => setIsOpen(true)}>
        <Icon name='flag' />
        {translate('umpire.end.open')}
      </Button>
    )
  }

  const close = (): void => {
    setIsOpen(false)
    setBy(null)
  }

  return (
    <section
      aria-labelledby='end-match-title'
      className='end-match-panel'
      ref={panelRef}
    >
      <h2 id='end-match-title'>{translate('umpire.end.title')}</h2>
      <p>{translate('umpire.end.explain')}</p>
      <fieldset>
        <legend>{translate('umpire.end.who')}</legend>
        <ToggleButtonGroup
          aria-label={translate('umpire.end.who')}
          onSelectionChange={(keys) => {
            const [key] = keys
            setBy(isSide(key) ? key : null)
          }}
          selectedKeys={by === null ? [] : [by]}
        >
          {sides.map((side) => (
            <ToggleButton id={side} key={side}>
              {nameOf(side)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </fieldset>
      <fieldset>
        <legend>{translate('umpire.end.why')}</legend>
        <ToggleButtonGroup
          aria-label={translate('umpire.end.why')}
          disallowEmptySelection
          onSelectionChange={(keys) => {
            const [key] = keys
            if (isReason(key)) {
              setReason(key)
            }
          }}
          selectedKeys={[reason]}
        >
          {REASONS.map((option) => (
            <ToggleButton id={option} key={option}>
              {translate(`umpire.end.reason.${option}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </fieldset>
      <div className='end-match-actions'>
        <Button onPress={close}>{translate('umpire.end.cancel')}</Button>
        <Button
          isDisabled={by === null}
          onPress={() => {
            if (by !== null) {
              onConcede({ by, reason })
              close()
            }
          }}
          variant='stop'
        >
          {by === null
            ? translate('umpire.end.pick')
            : translate('umpire.end.confirm', {
                name: nameOf(opponentOf(by))
              })}
        </Button>
      </div>
    </section>
  )
}
