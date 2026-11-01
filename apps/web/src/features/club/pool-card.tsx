import type React from 'react'

import type { ChampionshipPool } from '@scoreboard/protocol/championship'
import type { ClubRecord } from '@scoreboard/protocol/club-record'

import { roundIndexForDay } from '@scoreboard/core/championship/championship-calendar'
import { poolStandingsFor } from '@scoreboard/core/championship/championship-standings'

import { nowMs } from '@/infrastructure/clock'
import { dayAsDate, toLocalDay } from '@/infrastructure/dates'
import { Button } from '@/presentation/components/button'
import {
  Disclosure,
  DisclosurePanel
} from '@/presentation/components/disclosure'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { updatePool } from './championship-edits'
import { isOwnTeam } from './club-teams'
import { PoolComposer } from './pool-composer'
import { PoolRounds } from './pool-rounds'
import { PoolStandings } from './pool-standings'
import { PoolTeamMark } from './pool-team-mark'

type PoolCardProps = {
  onChange: (record: ClubRecord) => void
  pool: ChampionshipPool
  record: ClubRecord
}

/**
 * One of our pools folded to what the organiser looks for: our team, where it
 * stands and the next round. Open: the standings, the rounds with their
 * results, then the pool as the federation's calendar gives it.
 */
export const PoolCard: React.FC<PoolCardProps> = ({
  onChange,
  pool,
  record
}) => {
  const translate = useTranslate()
  const ownTeams = record.own.teams.filter((team) =>
    pool.teams.includes(team.id)
  )
  const standings = poolStandingsFor(pool)
  const hasResults = standings.some((row) => row.played > 0)
  const ownRows = standings.filter((row) => isOwnTeam(record, row.teamId))
  const nextIndex = roundIndexForDay({
    day: toLocalDay(nowMs()),
    ownTeamIds: ownTeams.map((team) => team.id),
    pool
  })
  const next = nextIndex === null ? undefined : pool.rounds[nextIndex]
  const firstOwn = ownTeams.at(0)

  return (
    <Disclosure className='pool-card'>
      <Button className='pool-card-trigger' slot='trigger' variant='quiet'>
        {firstOwn === undefined ? (
          <span className='pool-team-mark' data-empty />
        ) : (
          <PoolTeamMark
            number={pool.teams.indexOf(firstOwn.id) + 1}
            team={firstOwn}
          />
        )}
        <span className='team-editor-name'>
          {ownTeams.length === 0
            ? translate('club.championship.noOwnTeam')
            : ownTeams.map((team) => team.name).join(' · ')}
        </span>
        <span className='team-editor-detail'>
          {[
            pool.division,
            pool.number === null
              ? null
              : translate('club.championship.poolNumber', {
                  number: String(pool.number)
                }),
            translate('club.championship.phase', {
              nextSeason: String(pool.season + 1),
              phase: String(pool.phase),
              season: String(pool.season)
            })
          ]
            .filter((part) => part !== null)
            .join(' · ')}
        </span>
        {next === undefined || nextIndex === null ? null : (
          <span className='pool-card-next'>
            {translate('club.championship.next', {
              number: String(nextIndex + 1)
            })}
            {next.date === null
              ? null
              : ` · ${translate('club.championship.rounds.date', {
                  at: dayAsDate(next.date)
                })}`}
          </span>
        )}
        {hasResults && ownRows.length > 0 ? (
          <span className='pool-card-rank'>
            {ownRows.map((row) => (
              <span key={row.number}>
                <span className='pool-card-rank-figure'>
                  {translate('club.championship.rank', { rank: row.rank })}
                </span>
                <span className='pool-card-points'>
                  {translate('club.championship.points', {
                    count: row.points
                  })}
                </span>
              </span>
            ))}
          </span>
        ) : null}
        <Icon name='chevronDown' />
      </Button>
      <DisclosurePanel>
        <div className='pool-card-body'>
          <PoolStandings pool={pool} record={record} />
          <PoolRounds
            onChange={(next) => onChange(updatePool(record, next))}
            pool={pool}
            record={record}
          />
          <PoolComposer onChange={onChange} pool={pool} record={record} />
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}
