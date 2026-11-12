import type React from 'react'

import type { ClubCode, ClubRecord } from '@scoreboard/protocol/club-record'

import {
  currentPoolsOf,
  poolsLatestFirst
} from '@/features/club/championship-edits'
import { useClubTranslate } from '@/features/club/use-club-translate'
import type { FederationPoolsById } from '@/features/club/use-federation-pools'
import { paintOf } from '@/features/event/team-paint'
import { paths } from '@/infrastructure/router/navigation'
import { Icon } from '@/presentation/components/icon'
import { Link } from '@/presentation/components/link'
import { RichText } from '@/presentation/i18n/rich-text'

import { leadingStandingOf } from './club-standing'

const groupedCode = (code: string): string =>
  code.match(/.{1,4}/g)?.join(' ') ?? code

const strong = (children: string): React.ReactNode => (
  <b className='home-code'>{children}</b>
)

type ClubSeasonProps = {
  code: ClubCode
  federationPools: FederationPoolsById
  record: ClubRecord
}

/** The club's season at a glance, each line opening the club page: its teams, its pools, its directory. */
export const ClubSeason: React.FC<ClubSeasonProps> = ({
  code,
  federationPools,
  record
}) => {
  const translate = useClubTranslate()
  const teams = record.own.teams
  const pools = currentPoolsOf(record)
  const latestPool = poolsLatestFirst(pools).at(0)
  const standing = leadingStandingOf(record, federationPools)
  const directoryCount = [record.own, ...record.opponents].reduce(
    (count, club) => count + club.players.length,
    0
  )

  return (
    <section aria-labelledby='home-season-title' className='home-block'>
      <h2 id='home-season-title'>{translate('home.season.title')}</h2>
      <ul className='home-rows'>
        <li>
          <Link className='home-row' href={paths.club}>
            <span className='home-row-main'>
              <b>{translate('home.season.teams')}</b>
              {teams.length === 0 ? (
                <span>{translate('home.season.teamsEmpty')}</span>
              ) : (
                <span aria-hidden='true' className='home-swatches'>
                  {teams.map((team) => {
                    const paint = paintOf(team)

                    return (
                      <i
                        data-white={paint.isWhite || undefined}
                        key={team.id}
                        style={{ background: paint.colour }}
                      />
                    )
                  })}
                </span>
              )}
            </span>
            {teams.length === 0 ? null : (
              <span className='home-row-count'>{teams.length}</span>
            )}
            <Icon name='arrowRight' />
          </Link>
        </li>
        <li>
          <Link className='home-row' href={paths.club}>
            <span className='home-row-main'>
              <b>{translate('home.season.pools')}</b>
              <span>
                {latestPool === undefined
                  ? translate('home.season.poolsEmpty')
                  : standing !== null
                    ? translate('home.season.poolsRank', {
                        phase: String(standing.phase),
                        rank: standing.rank,
                        team: standing.team.name
                      })
                    : translate('home.season.poolsDetail', {
                        count: pools.length,
                        phase: String(latestPool.phase)
                      })}
              </span>
            </span>
            <Icon name='arrowRight' />
          </Link>
        </li>
        <li>
          <Link className='home-row' href={paths.club}>
            <span className='home-row-main'>
              <b>{translate('home.season.directory')}</b>
              <span>{translate('home.season.directoryDetail')}</span>
            </span>
            {directoryCount === 0 ? null : (
              <span className='home-row-count'>{directoryCount}</span>
            )}
            <Icon name='arrowRight' />
          </Link>
        </li>
      </ul>
      <p className='home-hint'>
        <RichText
          parts={translate.rich('home.season.code', {
            b: strong,
            code: groupedCode(code)
          })}
        />
      </p>
    </section>
  )
}
