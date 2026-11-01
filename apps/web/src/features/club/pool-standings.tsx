import type React from 'react'

import type { ChampionshipPool } from '@scoreboard/protocol/championship'
import type { ClubRecord } from '@scoreboard/protocol/club-record'

import { poolStandingsFor } from '@scoreboard/core/championship/championship-standings'

import { useTranslate } from '@/presentation/i18n/i18n-context'

import { clubSideOf, isOwnTeam } from './club-teams'
import { PoolTeamMark } from './pool-team-mark'

type PoolStandingsProps = {
  pool: ChampionshipPool
  record: ClubRecord
}

/** The pool's table as the federation prints it: rank, team, played, won, drawn, lost, points; ours on grey. */
export const PoolStandings: React.FC<PoolStandingsProps> = ({
  pool,
  record
}) => {
  const translate = useTranslate()
  const rows = poolStandingsFor(pool)
  const hasResults = rows.some((row) => row.played > 0)

  return (
    <div className='pool-standings'>
      <h4 className='club-label'>
        {translate('club.championship.standings.title')}
      </h4>
      <table>
        <thead>
          <tr>
            <th scope='col'>
              <abbr title={translate('club.championship.standings.rank')}>
                {translate('club.championship.standings.rankShort')}
              </abbr>
            </th>
            <th className='pool-standings-team' scope='col'>
              {translate('club.championship.standings.team')}
            </th>
            <th scope='col'>
              <abbr title={translate('club.championship.standings.played')}>
                {translate('club.championship.standings.playedShort')}
              </abbr>
            </th>
            <th className='pool-standings-detail' scope='col'>
              <abbr title={translate('club.championship.standings.won')}>
                {translate('club.championship.standings.wonShort')}
              </abbr>
            </th>
            <th className='pool-standings-detail' scope='col'>
              <abbr title={translate('club.championship.standings.drawn')}>
                {translate('club.championship.standings.drawnShort')}
              </abbr>
            </th>
            <th className='pool-standings-detail' scope='col'>
              <abbr title={translate('club.championship.standings.lost')}>
                {translate('club.championship.standings.lostShort')}
              </abbr>
            </th>
            <th scope='col'>
              <abbr title={translate('club.championship.standings.points')}>
                {translate('club.championship.standings.pointsShort')}
              </abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const side = clubSideOf(record, row.teamId)

            return (
              <tr
                data-own={isOwnTeam(record, row.teamId) || undefined}
                key={row.number}
              >
                <td>{hasResults ? row.rank : '–'}</td>
                <th className='pool-standings-team' scope='row'>
                  <PoolTeamMark number={row.number} team={side?.team} />
                  <span className='pool-team-name'>
                    {side?.team.name ??
                      translate('club.championship.unknownTeam', {
                        number: String(row.number)
                      })}
                  </span>
                </th>
                <td>{row.played}</td>
                <td className='pool-standings-detail'>{row.won}</td>
                <td className='pool-standings-detail'>{row.drawn}</td>
                <td className='pool-standings-detail'>
                  {row.lost + row.forfeited}
                </td>
                <td className='pool-standings-points'>{row.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
