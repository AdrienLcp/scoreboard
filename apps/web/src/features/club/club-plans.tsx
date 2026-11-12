import type React from 'react'

import type { ClubRecord } from '@scoreboard/protocol/club-record'

import { useClubTranslate } from '@/features/club/use-club-translate'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'

import { deleteClubPlan, setDefaultClubPlan } from './club-edits'
import { ClubHallPlan } from './club-hall-plan'

import './club-plans.sass'

type ClubPlansProps = {
  onChange: (record: ClubRecord) => void
  record: ClubRecord
}

/** The ways the club sets its hall up, each drawn, the one new events start from starred. */
export const ClubPlans: React.FC<ClubPlansProps> = ({ onChange, record }) => {
  const translate = useClubTranslate()

  if (record.plans.length === 0) {
    return <p className='club-note'>{translate('club.hall.empty')}</p>
  }

  return (
    <>
      <p className='club-note'>{translate('club.hall.help')}</p>
      <ul className='club-plans'>
        {record.plans.map((saved) => {
          const name =
            saved.name ??
            translate('organiser.plan.hallOf', {
              count: saved.plan.tables.length
            })
          const isDefault = saved.id === record.defaultPlanId

          return (
            <li className='club-plan' key={saved.id}>
              <ClubHallPlan plan={saved.plan} />
              <div className='club-plan-foot'>
                <h3 className='club-plan-name'>{name}</h3>
                <Button
                  aria-pressed={isDefault}
                  onPress={() => onChange(setDefaultClubPlan(record, saved.id))}
                  variant='quiet'
                >
                  <Icon name={isDefault ? 'star' : 'starOutline'} />
                  {translate(
                    isDefault ? 'club.hall.default' : 'club.hall.makeDefault'
                  )}
                </Button>
                <Button
                  aria-label={translate('club.hall.delete', { name })}
                  onPress={() => onChange(deleteClubPlan(record, saved.id))}
                  variant='quiet'
                >
                  <Icon name='trash' />
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
