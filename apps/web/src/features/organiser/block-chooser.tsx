import type React from 'react'
import { Button as AriaButton, Dialog, Heading } from 'react-aria-components'

import type { EncounterId, TableNumber } from '@scoreboard/protocol/identifiers'

import { Icon } from '@/presentation/components/icon'
import { Popover } from '@/presentation/components/select'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import './block-chooser.sass'

/** An encounter as the chooser offers it: its teams in their colours and where it plays now. */
export type ChoosableEncounter = {
  awayName: string
  colours: { away: string; home: string } | null
  homeName: string
  id: EncounterId
  tables: readonly TableNumber[]
}

type BlockChooserProps = {
  encounters: readonly ChoosableEncounter[]
  first: TableNumber
  onChoose: (encounterId: EncounterId | null) => void
  onClose: () => void
  trigger: HTMLElement
}

/**
 * Which encounter plays on a block: the encounters as team chips, the one
 * already there marked; picking another swaps the two blocks' encounters.
 */
export const BlockChooser: React.FC<BlockChooserProps> = ({
  encounters,
  first,
  onChoose,
  onClose,
  trigger
}) => {
  const translate = useTranslate()
  const block = [first, first + 1]
  const current = encounters.find((encounter) =>
    encounter.tables.some((table) => block.includes(table))
  )

  return (
    <Popover
      className='block-chooser'
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose()
        }
      }}
      placement='bottom'
      triggerRef={{ current: trigger }}
    >
      <Dialog className='block-chooser-dialog'>
        <Heading className='block-chooser-title' slot='title'>
          {translate('organiser.plan.chooseFor', {
            block: `${first}–${first + 1}`
          })}
        </Heading>
        <ul className='block-chooser-list'>
          {encounters.map((encounter) => (
            <li key={encounter.id}>
              <AriaButton
                aria-current={encounter.id === current?.id || undefined}
                className='block-chooser-option'
                onPress={() => onChoose(encounter.id)}
              >
                <span aria-hidden='true' className='block-chooser-swatches'>
                  {encounter.colours === null ? null : (
                    <>
                      <span style={{ '--team': encounter.colours.home }} />
                      <span style={{ '--team': encounter.colours.away }} />
                    </>
                  )}
                </span>
                <span className='block-chooser-names'>
                  {encounter.homeName} – {encounter.awayName}
                </span>
                <span className='block-chooser-where'>
                  {encounter.id === current?.id ? (
                    <Icon name='check' />
                  ) : encounter.tables.length === 0 ? (
                    translate('organiser.hall.noTable')
                  ) : (
                    encounter.tables.join('–')
                  )}
                </span>
              </AriaButton>
            </li>
          ))}
          <li>
            <AriaButton
              aria-current={current === undefined || undefined}
              className='block-chooser-option'
              data-none
              onPress={() => onChoose(null)}
            >
              <span className='block-chooser-names'>
                {translate('organiser.plan.noEncounter')}
              </span>
              {current === undefined ? (
                <span className='block-chooser-where'>
                  <Icon name='check' />
                </span>
              ) : null}
            </AriaButton>
          </li>
        </ul>
      </Dialog>
    </Popover>
  )
}
