import type React from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import { Radio, RadioGroup } from 'react-aria-components'

import type { Display, EventSetup } from '@scoreboard/protocol/event-setup'
import type {
  ConnectedScreen,
  PublicSnapshot
} from '@scoreboard/protocol/event-snapshot'
import type {
  EventId,
  OrganiserCode,
  TableNumber
} from '@scoreboard/protocol/identifiers'
import { type WallView, wallViewSchema } from '@scoreboard/protocol/wall-view'

import { tablesShownOn } from '@scoreboard/core/event/display-board'

import {
  type ClubTranslate,
  useClubTranslate
} from '@/features/club/use-club-translate'
import { tableScopeOf } from '@/features/display/table-scope'
import { wallViewOf } from '@/features/display/wall-view'
import { newDisplayId } from '@/infrastructure/ids'
import {
  displayOfPathFor,
  displayPathFor,
  usePairingSearchParam,
  useScreenConnectParam
} from '@/infrastructure/router/navigation'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { ButtonLink } from '@/presentation/components/link'

import { ChoiceField } from './choice-field'
import { ConfirmButton } from './confirm-button'
import {
  tableSharesOf,
  withDisplayTables,
  withNewDisplay,
  withScreenView
} from './screen-edits'
import { screenSketchOf } from './screen-sketch'
import { removeDisplay } from './setup-edits'
import { WallPairingForm } from './wall-pairing-form'
import { WallViewThumbnail } from './wall-view-thumbnail'

import './screens-panel.sass'

type ScreensPanelProps = {
  code: OrganiserCode
  /** The screens a TV shows right now, from the organiser's snapshot. */
  connectedScreens: readonly ConnectedScreen[]
  /** The event as the screens see it: what each wall draws today. */
  event: PublicSnapshot
  eventId: EventId
  onSave: (setup: EventSetup) => void
  setup: EventSetup
}

/** The first number an automatic screen name takes: the main screen is the first. */
const FIRST_ADDED_SCREEN = 2

const shareKey = (tables: readonly TableNumber[]): string => tables.join('-')

const shareLabel = (
  translate: ClubTranslate,
  tables: readonly TableNumber[],
  tableCount: number
): string => {
  const first = tables[0]
  const last = tables.at(-1)

  if (tables.length === tableCount) {
    return translate('organiser.displays.everyTable')
  }

  return first !== undefined &&
    last !== undefined &&
    first !== last &&
    last - first + 1 === tables.length
    ? translate('organiser.displays.shareRun', { first, last })
    : tableScopeOf(translate, tables)
}

const freeScreenName = (
  translate: ClubTranslate,
  setup: EventSetup
): string => {
  const names = new Set(setup.displays.map((display) => display.name))
  let number = FIRST_ADDED_SCREEN + setup.displays.length

  while (names.has(translate('organiser.displays.screenName', { number }))) {
    number += 1
  }

  return translate('organiser.displays.screenName', { number })
}

const ScreenBlock: React.FC<{
  display: Display | null
  event: PublicSnapshot
  eventId: EventId
  isConnected: boolean
  onSave: (setup: EventSetup) => void
  setup: EventSetup
}> = ({ display, event, eventId, isConnected, onSave, setup }) => {
  const translate = useClubTranslate()
  const name = display?.name ?? translate('organiser.displays.all')
  const tables =
    tablesShownOn({
      displayId: display?.id ?? null,
      displays: setup.displays,
      tableCount: setup.tableCount
    }) ?? []
  const sketch = screenSketchOf({ snapshot: event, tables })
  const asked = wallViewOf({
    display: display ?? undefined,
    wallView: setup.wallView
  })
  const shown: WallView =
    asked === 'encounters' || !sketch.canShowHall ? 'encounters' : 'hall'
  const shares = tableSharesOf(setup.tableCount)
  const choices = [
    ...shares,
    ...(display === null ||
    shares.some((share) => shareKey(share) === shareKey(display.tables))
      ? []
      : [display.tables])
  ].map((share) => ({
    id: shareKey(share),
    label: shareLabel(translate, share, setup.tableCount)
  }))

  return (
    <li className='screen'>
      <div className='screen-head'>
        <Icon name='display' />
        <b className='screen-name'>{name}</b>
        <span className='screen-link' data-connected={isConnected || undefined}>
          {isConnected ? (
            <span aria-hidden='true' className='screen-dot' />
          ) : null}
          {translate(
            isConnected
              ? 'organiser.displays.connected'
              : 'organiser.displays.notConnected'
          )}
        </span>
        <ButtonLink
          className='screen-see'
          href={
            display === null
              ? displayPathFor(eventId)
              : displayOfPathFor({ displayId: display.id, eventId })
          }
          target='_blank'
          variant='quiet'
        >
          <Icon name='open' />
          {translate('organiser.displays.see')}
        </ButtonLink>
      </div>
      <RadioGroup
        aria-label={translate('organiser.displays.view.label', { name })}
        className='screen-views'
        onChange={(value) => {
          const view = wallViewSchema.safeParse(value)

          if (view.success) {
            onSave(withScreenView(setup, display?.id ?? null, view.data))
          }
        }}
        orientation='horizontal'
        value={shown}
      >
        {wallViewSchema.options.map((view) => (
          <Radio
            className='screen-view'
            isDisabled={view === 'hall' && !sketch.canShowHall}
            key={view}
            value={view}
          >
            {({ isSelected }) => (
              <>
                <WallViewThumbnail sketch={sketch} view={view} />
                <span className='screen-view-name'>
                  {isSelected ? <Icon name='check' /> : null}
                  {translate(
                    view === 'encounters' && (setup.tournament ?? null) !== null
                      ? 'organiser.displays.view.pools'
                      : `organiser.displays.view.${view}`
                  )}
                </span>
              </>
            )}
          </Radio>
        ))}
      </RadioGroup>
      {sketch.canShowHall ? null : (
        <p className='screen-hint'>
          {translate('organiser.displays.view.unavailable')}
        </p>
      )}
      {display === null ? (
        <p className='screen-tables'>
          <span>{translate('organiser.displays.tables')}</span>
          <b>{translate('organiser.displays.everyTable')}</b>
        </p>
      ) : (
        <>
          <ChoiceField
            choices={choices}
            label={translate('organiser.displays.tables')}
            onChange={(id) => {
              const share = shares.find((one) => shareKey(one) === id)

              if (share !== undefined) {
                onSave(withDisplayTables(setup, display.id, share))
              }
            }}
            selectedId={shareKey(display.tables)}
          />
          <span className='screen-removal'>
            <ConfirmButton
              confirmLabel={translate('organiser.displays.remove', { name })}
              label={translate('organiser.remove')}
              onConfirm={() => onSave(removeDisplay(setup, display.id))}
            />
          </span>
        </>
      )}
    </li>
  )
}

/**
 * The event's big screens: each with whether a TV shows it, its link, its
 * view chosen by picture, by encounter or as in the hall, and the tables it
 * shows; then a TV to connect, and a screen to add for part of the tables.
 * The address opens the connection form, from the console's header or a
 * scanned TV's code: this panel holds the event's only one.
 */
export const ScreensPanel: React.FC<ScreensPanelProps> = ({
  code,
  connectedScreens,
  event,
  eventId,
  onSave,
  setup
}) => {
  const translate = useClubTranslate()
  const titleId = useId()
  const scannedCode = usePairingSearchParam()
  const connectAsk = useScreenConnectParam()
  const isAsked = connectAsk.isAsked || scannedCode !== null
  const [isPairing, setIsPairing] = useState(isAsked)
  const pairing = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAsked) {
      return
    }

    setIsPairing(true)
    requestAnimationFrame(() => {
      pairing.current?.scrollIntoView({ block: 'center' })
      pairing.current?.querySelector('input')?.focus({ preventScroll: true })
    })
  }, [isAsked])

  return (
    <section aria-labelledby={titleId} className='screens-panel'>
      <h2 className='screens-title' id={titleId}>
        {translate('organiser.displays.screens')}
      </h2>
      <ul className='screens-list'>
        {[null, ...setup.displays].map((display) => (
          <ScreenBlock
            display={display}
            event={event}
            eventId={eventId}
            isConnected={connectedScreens.some(
              (screen) => screen.displayId === (display?.id ?? null)
            )}
            key={display?.id ?? 'every-table'}
            onSave={onSave}
            setup={setup}
          />
        ))}
      </ul>
      {isPairing ? (
        <div className='screens-pairing' ref={pairing}>
          <WallPairingForm
            code={code}
            eventId={eventId}
            scannedCode={scannedCode}
            setup={setup}
          />
          <Button
            onPress={() => {
              setIsPairing(false)
              connectAsk.dismiss()
            }}
            variant='quiet'
          >
            <Icon name='close' />
            {translate('organiser.displays.pair.close')}
          </Button>
        </div>
      ) : (
        <Button onPress={() => setIsPairing(true)}>
          <Icon name='plus' />
          {translate('organiser.displays.connect')}
        </Button>
      )}
      <Button
        onPress={() =>
          onSave(
            withNewDisplay(setup, {
              id: newDisplayId(),
              name: freeScreenName(translate, setup)
            })
          )
        }
        variant='quiet'
      >
        <Icon name='plus' />
        {translate('organiser.displays.addScreen')}
      </Button>
    </section>
  )
}
