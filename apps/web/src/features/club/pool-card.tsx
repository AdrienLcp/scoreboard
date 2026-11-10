import type React from 'react'

import type { ChampionshipPool } from '@scoreboard/protocol/championship'
import type { ClubRecord } from '@scoreboard/protocol/club-record'

import { roundIndexForDay } from '@scoreboard/core/championship/championship-calendar'
import { poolStandingsFor } from '@scoreboard/core/championship/championship-standings'

import type { FederationError } from '@/infrastructure/api/federation-api'
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
import { FederationPoolView } from './federation-pool-view'
import { useFederationClubTeams, useFederationPool } from './federation-queries'
import {
  type FederationSelf,
  federationTeamOf,
  isSelfStanding,
  nextFederationRoundOf
} from './federation-season'
import { PoolComposer } from './pool-composer'
import { PoolRounds } from './pool-rounds'
import { PoolStandings } from './pool-standings'
import { PoolTeamMark } from './pool-team-mark'

type PoolCardProps = {
  /** A pool of this phase: the FFTT publishes only the current one. */
  isCurrent: boolean
  onChange: (record: ClubRecord) => void
  pool: ChampionshipPool
  record: ClubRecord
}

const SKELETON_ROWS = [1, 2, 3, 4, 5, 6] as const

/** Why the FFTT's pool is not shown yet, or not at all: the hand-kept one stands in for it. */
type FederationNoticeKind = Exclude<FederationError, 'off'> | 'loading'

const FederationNotice: React.FC<{ notice: FederationNoticeKind }> = ({
  notice
}) => {
  const translate = useTranslate()

  if (notice === 'loading') {
    return (
      <p className='federation-season-notice'>
        <Icon name='sync' />
        {translate('club.federation.season.loading')}
      </p>
    )
  }

  return (
    <p className='federation-season-notice' role='alert'>
      <Icon name={notice === 'offline' ? 'wifiOff' : 'alert'} />
      {translate(
        notice === 'offline'
          ? 'club.federation.season.offline'
          : 'club.federation.season.down'
      )}
    </p>
  )
}

/** Our team as the FFTT knows it in this pool: what its teams of the club say, once they answer. */
const useFederationSelf = ({
  isCurrent,
  name,
  phase,
  record
}: {
  isCurrent: boolean
  name: string | undefined
  phase: ChampionshipPool['phase']
  record: ClubRecord
}) => {
  const clubNumber = record.own.number
  const teams = useFederationClubTeams(
    isCurrent && name !== undefined ? clubNumber : null
  )

  if (teams === null || clubNumber === null || name === undefined) {
    return { notice: null, self: null }
  }

  if (teams.status !== 'ready') {
    return {
      notice: teams.status === 'off' ? null : teams.status,
      self: null
    }
  }

  const team = federationTeamOf({ name, phase, teams: teams.data })

  return {
    notice: null,
    self: team === null ? null : ({ clubNumber, team } satisfies FederationSelf)
  }
}

/**
 * One of our pools folded to what the organiser looks for: our team, where it
 * stands and the next round. Open: the standings, the rounds with their
 * results, then the pool as the federation's calendar gives it.
 */
export const PoolCard: React.FC<PoolCardProps> = ({
  isCurrent,
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
  const federation = useFederationSelf({
    isCurrent,
    name: firstOwn?.name,
    phase: pool.phase,
    record
  })
  const federationState = useFederationPool(federation.self?.team.pool ?? null)
  const federationPool =
    federationState?.status === 'ready' ? federationState.data : null
  const notice =
    federation.notice ??
    (federationState === null || federationState.status === 'ready'
      ? null
      : federationState.status === 'off'
        ? null
        : federationState.status)
  const federationSelf = federation.self
  const federationOwn =
    federationPool === null || federationSelf === null
      ? undefined
      : federationPool.standings.find((row) =>
          isSelfStanding(federationSelf, row)
        )
  const federationNext =
    federationPool === null || federationSelf === null
      ? null
      : nextFederationRoundOf(federationSelf, federationPool)
  const handRounds = (
    <PoolRounds
      onChange={(next) => onChange(updatePool(record, next))}
      pool={pool}
      record={record}
    />
  )

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
          {federationPool === null ? null : (
            <span className='federation-tag-source pool-card-source'>
              <span className='visually-hidden'> · </span>
              {translate('club.federation.tag')}
            </span>
          )}
        </span>
        {federationNext !== null ? (
          <span className='pool-card-next'>
            {translate('club.championship.next', {
              number: String(federationNext.number)
            })}
            {federationNext.date === null
              ? null
              : ` · ${translate('club.championship.rounds.date', {
                  at: dayAsDate(federationNext.date)
                })}`}
          </span>
        ) : federationPool !== null ||
          next === undefined ||
          nextIndex === null ? null : (
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
        {federationPool !== null ? (
          federationOwn === undefined || federationOwn.played === 0 ? null : (
            <span className='pool-card-rank'>
              <span>
                <span className='pool-card-rank-figure'>
                  {translate('club.championship.rank', {
                    rank: federationOwn.rank
                  })}
                </span>
                <span className='pool-card-points'>
                  {translate('club.championship.points', {
                    count: federationOwn.points
                  })}
                </span>
              </span>
            </span>
          )
        ) : hasResults && ownRows.length > 0 ? (
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
          {notice === null ? null : <FederationNotice notice={notice} />}
          {federationPool !== null && federationSelf !== null ? (
            <>
              <FederationPoolView
                federationPool={federationPool}
                ownTeam={firstOwn}
                pool={pool}
                record={record}
                self={federationSelf}
              />
              <Disclosure className='pool-composer'>
                <Button
                  className='pool-composer-trigger'
                  slot='trigger'
                  variant='quiet'
                >
                  <Icon name='edit' />
                  <span>{translate('club.federation.season.byHand')}</span>
                  <span className='pool-composer-summary'>
                    {translate('club.federation.season.byHandSummary')}
                  </span>
                  <Icon name='chevronDown' />
                </Button>
                <DisclosurePanel>
                  <div className='pool-composer-body'>{handRounds}</div>
                </DisclosurePanel>
              </Disclosure>
            </>
          ) : notice === 'loading' ? (
            <div aria-hidden='true' className='federation-season-skeleton'>
              {SKELETON_ROWS.map((row) => (
                <i key={row} />
              ))}
            </div>
          ) : (
            <>
              <PoolStandings pool={pool} record={record} />
              {handRounds}
            </>
          )}
          <PoolComposer
            isFederal={federationPool !== null}
            key={federationPool === null ? 'hand' : 'federal'}
            onChange={onChange}
            pool={pool}
            record={record}
          />
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}
