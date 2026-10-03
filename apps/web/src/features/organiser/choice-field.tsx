import type React from 'react'

import { Button } from '@/presentation/components/button'
import {
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue
} from '@/presentation/components/select'
import { Label } from '@/presentation/components/text-field'

export type Choice = {
  id: string
  label: string
}

type ChoiceFieldProps = {
  choices: readonly Choice[]
  label: string
  onChange: (id: string | null) => void
  selectedId: string | null
}

/** One choice among a list, by id: a player, a team, a table. */
export const ChoiceField: React.FC<ChoiceFieldProps> = ({
  choices,
  label,
  onChange,
  selectedId
}) => (
  <Select
    onSelectionChange={(key) => {
      onChange(typeof key === 'string' ? key : null)
    }}
    selectedKey={selectedId}
  >
    <Label>{label}</Label>
    <Button>
      <SelectValue />
    </Button>
    <Popover>
      <ListBox items={choices}>
        {(choice) => <ListBoxItem id={choice.id}>{choice.label}</ListBoxItem>}
      </ListBox>
    </Popover>
  </Select>
)
