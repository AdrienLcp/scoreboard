import type React from 'react'
import { useState } from 'react'
import {
  Button as AriaButton,
  Dialog,
  DialogTrigger,
  Heading
} from 'react-aria-components'

import type { ClubHallPlan, HallPlan } from '@scoreboard/protocol/hall-plan'

import { saveClubPlan, setDefaultClubPlan } from '@/features/club/club-edits'
import { useClub } from '@/features/club/use-club'
import { useClubTranslate } from '@/features/club/use-club-translate'
import { Button } from '@/presentation/components/button'
import { Form } from '@/presentation/components/form'
import { Icon } from '@/presentation/components/icon'
import { Popover } from '@/presentation/components/select'
import { Switch } from '@/presentation/components/switch'
import { Input, Label, TextField } from '@/presentation/components/text-field'

import { PlanThumbnail } from './plan-thumbnail'

import './saved-plans.sass'

type SavedPlansProps = {
  onUse: (plan: HallPlan, name: string) => void
  plan: HallPlan
}

/**
 * The club's saved plans, under one button of the plan's head: each drawn
 * small, one tap uses it, the star makes it the default of new events; and
 * the plan on screen saved under a name.
 */
export const SavedPlans: React.FC<SavedPlansProps> = ({ onUse, plan }) => {
  const translate = useClubTranslate()
  const club = useClub()
  const [isOpen, setIsOpen] = useState(false)

  if (club.state.status !== 'ready') {
    return null
  }

  const { record } = club.state
  const nameOf = (saved: ClubHallPlan) =>
    saved.name ??
    translate('organiser.plan.hallOf', { count: saved.plan.tables.length })

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button variant='quiet'>
        <Icon name='plans' />
        {translate('organiser.plan.saved')}
        <Icon name='chevronDown' />
      </Button>
      <Popover className='saved-plans' placement='bottom end'>
        <Dialog className='saved-plans-dialog'>
          <Heading className='saved-plans-title' slot='title'>
            {translate('organiser.plan.saved')}
          </Heading>
          {record.plans.length === 0 ? (
            <p className='saved-plans-empty'>
              {translate('organiser.plan.noneSaved')}
            </p>
          ) : (
            <ul className='saved-plans-list'>
              {record.plans.map((saved) => {
                const isDefault = saved.id === record.defaultPlanId

                return (
                  <li className='saved-plan' key={saved.id}>
                    <AriaButton
                      className='saved-plan-use'
                      onPress={() => {
                        onUse(saved.plan, nameOf(saved))
                        setIsOpen(false)
                      }}
                    >
                      <PlanThumbnail plan={saved.plan} />
                      <span className='saved-plan-name'>{nameOf(saved)}</span>
                    </AriaButton>
                    <AriaButton
                      aria-label={translate(
                        isDefault
                          ? 'organiser.plan.isDefault'
                          : 'organiser.plan.makeDefault',
                        { name: nameOf(saved) }
                      )}
                      aria-pressed={isDefault}
                      className='saved-plan-default'
                      onPress={() =>
                        club.edit((current) =>
                          setDefaultClubPlan(current, saved.id)
                        )
                      }
                    >
                      <Icon name={isDefault ? 'star' : 'starOutline'} />
                    </AriaButton>
                  </li>
                )
              })}
            </ul>
          )}
          <SavePlanForm
            defaultName={translate('organiser.plan.hallOf', {
              count: plan.tables.length
            })}
            onSave={(name, isDefault) => {
              club.edit((current) =>
                saveClubPlan({
                  id: crypto.randomUUID(),
                  isDefault,
                  name,
                  plan,
                  record: current
                })
              )
              setIsOpen(false)
            }}
          />
        </Dialog>
      </Popover>
    </DialogTrigger>
  )
}

const SavePlanForm: React.FC<{
  defaultName: string
  onSave: (name: string, isDefault: boolean) => void
}> = ({ defaultName, onSave }) => {
  const translate = useClubTranslate()
  const [name, setName] = useState(defaultName)
  const [isDefault, setIsDefault] = useState(true)

  return (
    <Form
      className='saved-plans-form'
      onSubmit={(event) => {
        event.preventDefault()

        if (name.trim() !== '') {
          onSave(name.trim(), isDefault)
        }
      }}
    >
      <TextField isRequired maxLength={60} onChange={setName} value={name}>
        <Label>{translate('organiser.plan.saveName')}</Label>
        <Input />
      </TextField>
      <Switch isSelected={isDefault} onChange={setIsDefault}>
        {translate('organiser.plan.saveAsDefault')}
      </Switch>
      <Button type='submit'>
        <Icon name='save' />
        {translate('organiser.plan.save')}
      </Button>
    </Form>
  )
}
