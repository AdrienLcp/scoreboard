import type React from 'react'
import { useState } from 'react'

import {
  ComboBox,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover
} from '@/presentation/components/combo-box'
import { Icon } from '@/presentation/components/icon'
import {
  ToggleButton,
  ToggleButtonGroup
} from '@/presentation/components/toggle-button-group'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { matchesTyped, NAME_MAX_LENGTH } from './directory-search'

import './pick-field.sass'

/** One entry the field offers: a player, a team, a club. */
export type Pick = {
  /** What tells two entries apart at a glance: a club, ranking points, a seat. */
  detail?: string
  id: string
  label: string
}

type PickFieldProps = {
  /** What adding the typed text would create, as the list words it, or `null` when it cannot be added as it stands. */
  addLabel?: (typed: string) => string | null
  /** What the list says when nothing matches the typed text and it cannot be added. */
  emptyLabel: (typed: string) => string
  label: string
  /** Adds the typed entry where it belongs: its id picks it, `null` leaves the field empty for a caller that placed it itself. */
  onAdd?: (typed: string) => string | null
  onChange: (id: string | null) => void
  /** Best first: the club's own, then the most recently played. */
  picks: readonly Pick[]
  placeholder?: string
  /** How many of the first picks also stand as chips, one tap away; when they hold every pick and nothing can be added, the chips are the whole field. */
  quickPicks?: number
  selectedId: string | null
}

type Item = Pick & { isAddition?: true }

const ADDITION_ID = 'pick-field-addition'

/**
 * Picks an entry of the club's directory instead of typing it: the field
 * suggests as soon as it is touched, best first, narrows on the first letters
 * of any word, and only offers to add the typed name when nothing matches.
 * Emptying the field leaves nobody picked.
 */
export const PickField: React.FC<PickFieldProps> = ({
  addLabel,
  emptyLabel,
  label,
  onAdd,
  onChange,
  picks,
  placeholder,
  quickPicks = 0,
  selectedId
}) => {
  const translate = useTranslate()
  /** What is being typed; `null` while the field shows the picked entry. */
  const [typed, setTyped] = useState<string | null>(null)
  const selected = picks.find((pick) => pick.id === selectedId) ?? null
  const search = typed ?? ''
  const found: Item[] = picks.filter((pick) => matchesTyped(pick.label, search))
  const addition =
    onAdd === undefined || search.trim() === '' || found.length > 0
      ? null
      : (addLabel?.(search) ?? null)
  const items: Item[] =
    addition === null
      ? found
      : [...found, { id: ADDITION_ID, isAddition: true, label: addition }]
  const chips = picks.slice(0, quickPicks)

  const choose = (id: string | null) => {
    setTyped(null)
    onChange(id)
  }

  const isSearchable = onAdd !== undefined || picks.length > quickPicks

  return (
    <div className='pick-field'>
      {isSearchable ? (
        <ComboBox
          allowsEmptyCollection
          inputValue={typed ?? selected?.label ?? ''}
          items={items}
          menuTrigger='focus'
          onInputChange={(value) => {
            setTyped(value)

            if (value === '' && selectedId !== null) {
              onChange(null)
            }
          }}
          onSelectionChange={(key) => {
            if (key === ADDITION_ID) {
              const added = onAdd?.(search) ?? null

              if (added === null) {
                setTyped(null)
              } else {
                choose(added)
              }

              return
            }

            if (typeof key === 'string' && key !== selectedId) {
              choose(key)
            }
          }}
          selectedKey={selectedId}
        >
          <Label>{label}</Label>
          <div className='pick-field-box'>
            <Icon name='search' />
            <Input
              className='pick-field-input'
              maxLength={NAME_MAX_LENGTH}
              onFocus={(event) => {
                setTyped(null)
                event.currentTarget.select()
              }}
              placeholder={placeholder}
            />
          </div>
          <Popover className='pick-field-popover'>
            <ListBox<Item>
              renderEmptyState={() => (
                <p className='pick-field-empty'>
                  {search.trim() !== ''
                    ? emptyLabel(search.trim())
                    : translate(
                        onAdd === undefined
                          ? 'organiser.pick.nothing'
                          : 'organiser.pick.typeToAdd'
                      )}
                </p>
              )}
            >
              {(item) =>
                item.isAddition === true ? (
                  <ListBoxItem
                    className='pick-field-addition'
                    id={item.id}
                    textValue={item.label}
                  >
                    <Icon name='plus' />
                    <span>{item.label}</span>
                  </ListBoxItem>
                ) : (
                  <ListBoxItem id={item.id} textValue={item.label}>
                    <span className='pick-field-name'>{item.label}</span>
                    {item.detail === undefined ? null : (
                      <small>{item.detail}</small>
                    )}
                  </ListBoxItem>
                )
              }
            </ListBox>
          </Popover>
        </ComboBox>
      ) : (
        <span className='field-label'>{label}</span>
      )}
      {chips.length === 0 ? null : (
        <ToggleButtonGroup
          aria-label={label}
          className='pick-field-chips'
          disallowEmptySelection={!isSearchable}
          onSelectionChange={(keys) => {
            const [key = null] = [...keys]

            choose(typeof key === 'string' ? key : null)
          }}
          selectedKeys={selectedId === null ? [] : [selectedId]}
          selectionMode='single'
        >
          {chips.map((pick) => (
            <ToggleButton
              className='pick-field-chip'
              id={pick.id}
              key={pick.id}
            >
              {pick.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}
    </div>
  )
}
