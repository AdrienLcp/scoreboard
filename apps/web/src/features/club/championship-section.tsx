import type React from 'react'
import { useState } from 'react'

import type { ClubRecord } from '@scoreboard/protocol/club-record'

import { ChoiceField } from '@/features/organiser/choice-field'
import { nowMs } from '@/infrastructure/clock'
import { toLocalDay } from '@/infrastructure/dates'
import { newChampionshipPoolId } from '@/infrastructure/ids'
import { Button } from '@/presentation/components/button'
import {
  Disclosure,
  DisclosurePanel
} from '@/presentation/components/disclosure'
import { Form } from '@/presentation/components/form'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { addPool, currentPoolsOf, poolsLatestFirst } from './championship-edits'
import { PoolCard } from './pool-card'

import './championship-section.sass'

type ChampionshipSectionProps = {
  onChange: (record: ClubRecord) => void
  record: ClubRecord
}

/** The next pool to make: our first team without one this phase, else the first. */
const teamWithoutPool = (record: ClubRecord): string | null => {
  const current = currentPoolsOf(record)
  const latestPhase = current.at(0)

  return (
    (
      record.own.teams.find(
        (team) =>
          !current.some(
            (pool) =>
              pool.teams.includes(team.id) &&
              pool.season === latestPhase?.season &&
              pool.phase === latestPhase.phase
          )
      ) ?? record.own.teams.at(0)
    )?.id ?? null
  )
}

/**
 * Our teams' championship: each one's pool for this phase, its standings and
 * its rounds, and the earlier phases folded away.
 */
export const ChampionshipSection: React.FC<ChampionshipSectionProps> = ({
  onChange,
  record
}) => {
  const translate = useTranslate()
  const [teamId, setTeamId] = useState<string | null>(null)
  const current = currentPoolsOf(record)
  const earlier = poolsLatestFirst(record.pools).filter(
    (pool) => !current.includes(pool)
  )
  const pickedTeamId = teamId ?? teamWithoutPool(record)

  return (
    <section className='club-championship'>
      <h2 className='club-heading'>{translate('club.championship.title')}</h2>
      <p className='club-note'>{translate('club.championship.help')}</p>
      {current.map((pool) => (
        <PoolCard
          isCurrent
          key={pool.id}
          onChange={onChange}
          pool={pool}
          record={record}
        />
      ))}
      {earlier.length === 0 ? null : (
        <Disclosure className='pool-history'>
          <Button
            className='pool-history-trigger'
            slot='trigger'
            variant='quiet'
          >
            {translate('club.championship.earlier', { count: earlier.length })}
            <Icon name='chevronDown' />
          </Button>
          <DisclosurePanel>
            <div className='pool-history-body'>
              {earlier.map((pool) => (
                <PoolCard
                  isCurrent={false}
                  key={pool.id}
                  onChange={onChange}
                  pool={pool}
                  record={record}
                />
              ))}
            </div>
          </DisclosurePanel>
        </Disclosure>
      )}
      {record.own.teams.length === 0 ? (
        <p className='club-empty'>{translate('club.championship.noTeam')}</p>
      ) : (
        <Form
          className='club-inline-form'
          onSubmit={(event) => {
            event.preventDefault()

            if (pickedTeamId !== null) {
              onChange(
                addPool({
                  newPoolId: newChampionshipPoolId,
                  record,
                  teamId: pickedTeamId,
                  today: toLocalDay(nowMs())
                })
              )
              setTeamId(null)
            }
          }}
        >
          <ChoiceField
            choices={record.own.teams.map((team) => ({
              id: team.id,
              label: team.name
            }))}
            label={translate('club.championship.newPoolTeam')}
            onChange={setTeamId}
            selectedId={pickedTeamId}
          />
          <Button isDisabled={pickedTeamId === null} type='submit'>
            <Icon name='plus' />
            {translate('club.championship.newPool')}
          </Button>
        </Form>
      )}
    </section>
  )
}
