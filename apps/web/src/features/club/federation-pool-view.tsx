import type React from 'react'

import type { ChampionshipPool } from '@scoreboard/protocol/championship'
import type {
  ClubRecord,
  DirectoryTeam
} from '@scoreboard/protocol/club-record'
import type {
  FederationEncounterReference,
  FederationGame,
  FederationPool,
  FederationRound,
  FederationSheetPlayer
} from '@scoreboard/protocol/federation'

import { useClubTranslate } from '@/features/club/use-club-translate'
import { scoreText } from '@/features/event/score-text'
import { dayAsDate } from '@/infrastructure/dates'
import { Button } from '@/presentation/components/button'
import {
  Disclosure,
  DisclosurePanel
} from '@/presentation/components/disclosure'
import { Icon } from '@/presentation/components/icon'

import { useFederationEncounter } from './federation-queries'
import {
  type FederationSelf,
  federationScoreOf,
  fixtureLabelAsName,
  isSelfStanding,
  type OwnScore,
  selfFixtureOf,
  sheetScoreOf
} from './federation-season'
import { FederationSource } from './federation-source'
import { numbered } from './numbered'
import { PoolTeamMark } from './pool-team-mark'

import './federation-pool-view.sass'

type FederationPoolViewProps = {
  federationPool: FederationPool
  /** Our team in the hand-kept pool: its colour and number mark our row. */
  ownTeam: DirectoryTeam | undefined
  pool: ChampionshipPool
  record: ClubRecord
  self: FederationSelf
}

/**
 * A pool as the FFTT publishes it, read-only: its standings, then our
 * calendar, a played round opening the encounter's sheet. A round the FFTT
 * has not scored yet shows what our own sheet gave.
 */
export const FederationPoolView: React.FC<FederationPoolViewProps> = ({
  federationPool,
  ownTeam,
  pool,
  record,
  self
}) => {
  const translate = useClubTranslate()

  return (
    <>
      <FederationStandings
        federationPool={federationPool}
        ownNumber={
          ownTeam === undefined ? 0 : pool.teams.indexOf(ownTeam.id) + 1
        }
        ownTeam={ownTeam}
        self={self}
      />
      <div className='pool-rounds'>
        <h4 className='club-label'>
          {translate('club.championship.rounds.title')}
        </h4>
        <ol>
          {federationPool.rounds.map((round) => (
            <li key={round.number}>
              <FederationRoundLine
                pool={pool}
                record={record}
                round={round}
                self={self}
              />
            </li>
          ))}
        </ol>
      </div>
      <FederationSource />
    </>
  )
}

const FederationStandings: React.FC<{
  federationPool: FederationPool
  ownNumber: number
  ownTeam: DirectoryTeam | undefined
  self: FederationSelf
}> = ({ federationPool, ownNumber, ownTeam, self }) => {
  const translate = useClubTranslate()

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
            <th scope='col'>
              <abbr title={translate('club.championship.standings.points')}>
                {translate('club.championship.standings.pointsShort')}
              </abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          {federationPool.standings.map((row) => {
            const isOwn = isSelfStanding(self, row)

            return (
              <tr data-own={isOwn || undefined} key={row.teamId ?? row.team}>
                <td>{row.played > 0 ? row.rank : '–'}</td>
                <th className='pool-standings-team' scope='row'>
                  {isOwn && ownNumber > 0 ? (
                    <PoolTeamMark number={ownNumber} team={ownTeam} />
                  ) : (
                    <span aria-hidden='true' className='federation-mark-gap' />
                  )}
                  <span className='pool-team-name'>{row.team}</span>
                </th>
                <td>{row.played}</td>
                <td className='pool-standings-points'>{row.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const FederationRoundLine: React.FC<{
  pool: ChampionshipPool
  record: ClubRecord
  round: FederationRound
  self: FederationSelf
}> = ({ pool, record, round, self }) => {
  const translate = useClubTranslate()
  const own = selfFixtureOf(self, round)
  const head = (
    <>
      <span className='pool-round-number'>
        {translate('club.championship.rounds.short', {
          number: String(round.number)
        })}
      </span>
      <span className='pool-round-date'>
        {round.date === null
          ? translate('club.championship.rounds.undated')
          : translate('club.championship.rounds.date', {
              at: dayAsDate(round.date)
            })}
      </span>
    </>
  )

  if (own === null) {
    return (
      <div className='pool-round-trigger federation-round-line'>
        {head}
        <span className='pool-round-ours'>
          <span className='pool-round-line'>
            {translate('club.championship.rounds.rest')}
          </span>
        </span>
      </div>
    )
  }

  const { fixture, side } = own
  const federationScore = federationScoreOf(fixture, side)
  const score =
    federationScore ?? sheetScoreOf({ pool, record, roundNumber: round.number })
  const opponent = fixtureLabelAsName(
    side === 'home' ? fixture.awayTeam : fixture.homeTeam
  )
  const line = (
    <span className='pool-round-ours'>
      <OwnLine
        isFromSheet={federationScore === null}
        opponent={opponent}
        score={score}
        side={side}
      />
    </span>
  )

  if (federationScore === null || fixture.encounter === null) {
    return (
      <div className='pool-round-trigger federation-round-line'>
        {head}
        {line}
      </div>
    )
  }

  return (
    <Disclosure className='pool-round'>
      <Button className='pool-round-trigger' slot='trigger' variant='quiet'>
        {head}
        {line}
        <Icon name='chevronDown' />
      </Button>
      <DisclosurePanel>
        <FederationSheet reference={fixture.encounter} />
      </DisclosurePanel>
    </Disclosure>
  )
}

const OwnLine: React.FC<{
  isFromSheet: boolean
  opponent: string
  score: OwnScore | null
  side: 'away' | 'home'
}> = ({ isFromSheet, opponent, score, side }) => {
  const translate = useClubTranslate()

  return (
    <span
      className='pool-round-line'
      data-lost={(score !== null && score.ours < score.theirs) || undefined}
    >
      <Icon name={side === 'home' ? 'home' : 'away'} />
      <span className='visually-hidden'>
        {translate(
          side === 'home'
            ? 'club.championship.rounds.home'
            : 'club.championship.rounds.away'
        )}
      </span>
      <span className='pool-round-opponent'>{opponent}</span>
      {score === null ? null : (
        <span className='federation-round-score'>
          <span className='pool-round-score'>
            {scoreText(score.ours, score.theirs)}
          </span>
          {isFromSheet ? (
            <span className='federation-round-provisional'>
              {translate('club.federation.season.ourSheet')}
            </span>
          ) : null}
        </span>
      )}
    </span>
  )
}

/** "3–1": sets won by each side of a game. */
const setsOf = (game: FederationGame) => ({
  away: game.sets.filter((set) => set.away > set.home).length,
  home: game.sets.filter((set) => set.home > set.away).length
})

const pointsOf = (
  players: readonly FederationSheetPlayer[],
  name: string
): number | null =>
  players.find((player) => player.name === name)?.points ?? null

/** The encounter's sheet as the FFTT holds it: each game, its players and sets, the winner in ink. */
const FederationSheet: React.FC<{
  reference: FederationEncounterReference
}> = ({ reference }) => {
  const translate = useClubTranslate()
  const state = useFederationEncounter(reference)

  if (state === null || state.status === 'loading') {
    return (
      <p className='federation-season-notice'>
        <Icon name='sync' />
        {translate('club.federation.season.sheetLoading')}
      </p>
    )
  }

  if (state.status !== 'ready') {
    return (
      <p className='federation-season-notice' role='alert'>
        <Icon name={state.status === 'offline' ? 'wifiOff' : 'alert'} />
        {translate(
          state.status === 'offline'
            ? 'club.federation.season.sheetOffline'
            : 'club.federation.season.sheetDown'
        )}
      </p>
    )
  }

  const sheet = state.data

  return (
    <div className='federation-sheet'>
      <p className='federation-sheet-teams'>
        <span>{fixtureLabelAsName(sheet.homeTeam)}</span>
        <span />
        <span>{fixtureLabelAsName(sheet.awayTeam)}</span>
      </p>
      <ol>
        {numbered(sheet.games).map(({ entry: game, number }) => {
          const sets = setsOf(game)
          const winner =
            sets.home === sets.away
              ? null
              : sets.home > sets.away
                ? 'home'
                : 'away'

          return (
            <li key={number}>
              <SheetPlayers
                isWinner={winner === 'home'}
                names={game.homePlayers}
                players={sheet.homePlayers}
              />
              <span className='federation-sheet-sets'>
                {game.sets.length === 0 ? '–' : scoreText(sets.home, sets.away)}
              </span>
              <SheetPlayers
                isWinner={winner === 'away'}
                names={game.awayPlayers}
                players={sheet.awayPlayers}
              />
            </li>
          )
        })}
      </ol>
    </div>
  )
}

const SheetPlayers: React.FC<{
  isWinner: boolean
  names: readonly string[]
  players: readonly FederationSheetPlayer[]
}> = ({ isWinner, names, players }) => (
  <span className='federation-sheet-players' data-won={isWinner || undefined}>
    {names.map((name) => {
      const points = names.length === 1 ? pointsOf(players, name) : null

      return (
        <span key={name}>
          {name}
          {points === null ? null : (
            <span className='federation-sheet-points'> {points}</span>
          )}
        </span>
      )
    })}
  </span>
)
