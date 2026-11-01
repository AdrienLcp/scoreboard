import type React from 'react'

import type { Player, Team } from '@scoreboard/protocol/event-setup'
import type { MatchView } from '@scoreboard/protocol/event-snapshot'
import type { PlayerId } from '@scoreboard/protocol/identifiers'
import type { InstantMs } from '@scoreboard/protocol/scoring-event'
import type { Side } from '@scoreboard/protocol/side'
import type { MatchStage, Tournament } from '@scoreboard/protocol/tournament'

import {
  type PoolTable,
  poolTablesFor
} from '@scoreboard/core/tournament/pool-standings'

import { paintOf } from '@/features/event/team-paint'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import { MatchCard } from './match-card'

import './tournament-panel.sass'

type TournamentPanelProps = {
  followed: readonly PlayerId[]
  matches: readonly MatchView[]
  nowMs: InstantMs
  onFollow: (playerId: PlayerId, isFollowing: boolean) => void
  players: readonly Player[]
  teams: readonly Team[]
  tournament: Tournament
}

/** The club a player stands for: its logo, or its colour square without one, and its name. */
const ClubTag: React.FC<{ team: Team | undefined }> = ({ team }) => {
  if (team === undefined) {
    return null
  }

  const paint = paintOf(team)

  return (
    <span className='club-tag'>
      {team.logoUrl === null || team.logoUrl === undefined ? (
        <span
          aria-hidden='true'
          className='club-tag-swatch'
          data-white={paint.isWhite || undefined}
          style={{ '--team': paint.colour }}
        />
      ) : (
        <img alt='' className='club-tag-logo' src={team.logoUrl} />
      )}
      <span className='club-tag-name'>{team.name}</span>
    </span>
  )
}

type PoolTableCardProps = {
  followed: readonly PlayerId[]
  players: readonly Player[]
  table: PoolTable
  teams: readonly Team[]
}

const COLUMNS = ['wins', 'losses', 'games', 'points'] as const

const PoolTableCard: React.FC<PoolTableCardProps> = ({
  followed,
  players,
  table,
  teams
}) => {
  const translate = useTranslate()
  const isDrawn = table.standings.some((standing) => standing.isDrawn)

  return (
    <section className='pool-card'>
      <h2 className='pool-card-title'>
        {translate('spectator.pools.pool', { name: table.pool.name })}
        <span className='pool-card-state'>
          {translate(
            table.isComplete
              ? 'spectator.pools.complete'
              : 'spectator.pools.playing'
          )}
        </span>
      </h2>
      <table className='pool-table'>
        <thead>
          <tr>
            <th scope='col'>
              <span className='visually-hidden'>
                {translate('spectator.pools.rank')}
              </span>
            </th>
            <th scope='col'>{translate('spectator.pools.player')}</th>
            {COLUMNS.map((column) => (
              <th key={column} scope='col'>
                <abbr title={translate(`spectator.pools.long.${column}`)}>
                  {translate(`spectator.pools.short.${column}`)}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.standings.map((standing) => {
            const player = players.find(
              (candidate) => candidate.id === standing.playerId
            )

            return (
              <tr
                data-qualified={
                  (table.isComplete && standing.rank <= 2) || undefined
                }
                key={standing.playerId}
              >
                <td className='pool-rank'>
                  {standing.rank}
                  {standing.isDrawn ? (
                    <span aria-hidden='true' className='pool-drawn'>
                      *
                    </span>
                  ) : null}
                </td>
                <th className='pool-player' scope='row'>
                  <span className='pool-player-name'>
                    <span>{player?.name ?? ''}</span>
                    {followed.includes(standing.playerId) ? (
                      <Icon name='star' />
                    ) : null}
                  </span>
                  <ClubTag
                    team={teams.find((team) => team.id === player?.teamId)}
                  />
                </th>
                <td>{standing.wins}</td>
                <td>{standing.losses}</td>
                <td className='pool-games'>
                  {standing.gamesWon}–{standing.gamesLost}
                </td>
                <td className='pool-points'>{standing.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {isDrawn ? (
        <p className='pool-card-note'>{translate('spectator.pools.drawn')}</p>
      ) : null}
    </section>
  )
}

const BRACKET_ORDER: readonly MatchStage['kind'][] = [
  'semi-final',
  'third-place',
  'final'
]

const bracketRankOf = (match: MatchView): number =>
  BRACKET_ORDER.indexOf(match.stage?.kind ?? 'pool')

/** The pools' tables, then the bracket, for an individual tournament day. */
export const TournamentPanel: React.FC<TournamentPanelProps> = ({
  followed,
  matches,
  nowMs,
  onFollow,
  players,
  teams,
  tournament
}) => {
  const translate = useTranslate()
  const tables = poolTablesFor({ matches, tournament })
  const [firstPool, secondPool] = tournament.pools
  const bracket = matches
    .filter((match) => bracketRankOf(match) !== -1)
    .toSorted((left, right) => bracketRankOf(left) - bracketRankOf(right))
  const pendingNameFor =
    (stage: MatchStage | null | undefined) =>
    (side: Side): string => {
      const slot = side === 'home' ? 1 : 2

      switch (stage?.kind) {
        case 'semi-final': {
          const [winnerPool, runnerUpPool] =
            stage.slot === 1 ? [firstPool, secondPool] : [secondPool, firstPool]

          return side === 'home'
            ? translate('spectator.bracket.poolWinner', {
                pool: winnerPool?.name ?? ''
              })
            : translate('spectator.bracket.poolRunnerUp', {
                pool: runnerUpPool?.name ?? ''
              })
        }
        case 'final':
          return translate('spectator.bracket.semiWinner', { slot })
        case 'third-place':
          return translate('spectator.bracket.semiLoser', { slot })
        default:
          return translate('match.unnamedSide')
      }
    }

  return (
    <div className='tournament-panel'>
      {tables.map((table) => (
        <PoolTableCard
          followed={followed}
          key={table.pool.id}
          players={players}
          table={table}
          teams={teams}
        />
      ))}
      {bracket.length === 0 ? null : (
        <>
          <h2 className='spectator-group'>
            {translate('spectator.bracket.title')}
          </h2>
          {bracket.map((match) => (
            <MatchCard
              encounterMatches={[]}
              encounterTitle={null}
              followed={followed}
              key={match.id}
              match={match}
              nowMs={nowMs}
              onFollow={onFollow}
              pendingNameOf={pendingNameFor(match.stage)}
              players={players}
            />
          ))}
        </>
      )}
    </div>
  )
}
