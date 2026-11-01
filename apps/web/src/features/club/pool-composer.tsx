import type React from 'react'

import {
  type ChampionshipPool,
  MAX_POOL_SIZE,
  MIN_POOL_SIZE,
  SEASON_PHASES,
  type StandingsPoints
} from '@scoreboard/protocol/championship'
import type {
  ClubRecord,
  DirectoryTeam
} from '@scoreboard/protocol/club-record'

import { resizedPool } from '@scoreboard/core/championship/championship-calendar'

import { ChoiceField } from '@/features/organiser/choice-field'
import { ConfirmButton } from '@/features/organiser/confirm-button'
import { newDirectoryClubId, newTeamId } from '@/infrastructure/ids'
import { Button } from '@/presentation/components/button'
import {
  Disclosure,
  DisclosurePanel
} from '@/presentation/components/disclosure'
import { Icon } from '@/presentation/components/icon'
import { Input, Label, TextField } from '@/presentation/components/text-field'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import {
  datedRound,
  removePool,
  seatPoolTeam,
  updatePool
} from './championship-edits'
import { addTypedTeam } from './club-edits'
import { byRecentThenName } from './directory-search'
import { numbered } from './numbered'
import { type Pick, PickField } from './pick-field'

type PoolComposerProps = {
  onChange: (record: ClubRecord) => void
  pool: ChampionshipPool
  record: ClubRecord
}

const NO_NUMBER = 'none'
const POOL_NUMBERS = 20
const STANDINGS_VALUES = [-1, 0, 1, 2, 3, 4, 5] as const
const STANDINGS_OUTCOMES = ['win', 'draw', 'loss', 'forfeit'] as const

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index)

const phaseId = (season: number, phase: number) => `${season}-${phase}`

/** Our teams first, in their own order, then the opponents met most recently. */
const poolTeamsOf = (record: ClubRecord): DirectoryTeam[] => [
  ...record.own.teams,
  ...record.opponents
    .flatMap((club) => club.teams)
    .toSorted(byRecentThenName((team: DirectoryTeam) => team))
]

/**
 * Everything the federation's calendar gives, copied once: the pool's number
 * and phase, its teams in the calendar's order, the date of each round, and
 * what an encounter is worth in the standings.
 */
export const PoolComposer: React.FC<PoolComposerProps> = ({
  onChange,
  pool,
  record
}) => {
  const translate = useTranslate()
  const save = (next: ChampionshipPool) => onChange(updatePool(record, next))
  const numberLabel = (number: number) =>
    translate('club.championship.composer.teamNumber', {
      number: String(number)
    })
  const teamPicks: Pick[] = poolTeamsOf(record).map((team) => {
    const seat = pool.teams.indexOf(team.id)

    return {
      detail:
        seat === -1 ? (team.division ?? undefined) : numberLabel(seat + 1),
      id: team.id,
      label: team.name
    }
  })
  const phases = range(pool.season - 1, pool.season + 1).flatMap((season) =>
    SEASON_PHASES.map((phase) => ({
      id: phaseId(season, phase),
      label: translate('club.championship.phase', {
        nextSeason: String(season + 1),
        phase: String(phase),
        season: String(season)
      }),
      phase,
      season
    }))
  )
  const isComplete = pool.teams.every((teamId) => teamId !== null)

  return (
    <Disclosure className='pool-composer' defaultExpanded={!isComplete}>
      <Button className='pool-composer-trigger' slot='trigger' variant='quiet'>
        <Icon name='edit' />
        <span>{translate('club.championship.composer.title')}</span>
        <span className='pool-composer-summary'>
          {translate('club.championship.composer.summary', {
            rounds: String(pool.rounds.length),
            teams: String(pool.teams.length)
          })}
        </span>
        <Icon name='chevronDown' />
      </Button>
      <DisclosurePanel>
        <div className='pool-composer-body'>
          <div className='pool-composer-fields'>
            <ChoiceField
              choices={phases}
              label={translate('club.championship.composer.phase')}
              onChange={(id) => {
                const picked = phases.find((choice) => choice.id === id)

                if (picked !== undefined) {
                  save({ ...pool, phase: picked.phase, season: picked.season })
                }
              }}
              selectedId={phaseId(pool.season, pool.phase)}
            />
            <ChoiceField
              choices={[
                {
                  id: NO_NUMBER,
                  label: translate('club.championship.composer.noNumber')
                },
                ...range(1, POOL_NUMBERS).map((number) => ({
                  id: String(number),
                  label: translate('club.championship.poolNumber', {
                    number: String(number)
                  })
                }))
              ]}
              label={translate('club.championship.composer.number')}
              onChange={(id) =>
                save({
                  ...pool,
                  number: id === NO_NUMBER || id === null ? null : Number(id)
                })
              }
              selectedId={
                pool.number === null ? NO_NUMBER : String(pool.number)
              }
            />
            <ChoiceField
              choices={range(MIN_POOL_SIZE, MAX_POOL_SIZE).map((size) => ({
                id: String(size),
                label: translate('club.championship.composer.sizeChoice', {
                  count: String(size)
                })
              }))}
              label={translate('club.championship.composer.size')}
              onChange={(id) => {
                if (id !== null) {
                  save(resizedPool(pool, Number(id)))
                }
              }}
              selectedId={String(pool.teams.length)}
            />
          </div>
          <div className='pool-composer-group'>
            <p className='club-label'>
              {translate('club.championship.composer.teams')}
            </p>
            <div className='pool-composer-grid'>
              {numbered(pool.teams).map(({ entry: teamId, number }) => (
                <PickField
                  addLabel={(typed) =>
                    translate('organiser.pick.addTeam', { name: typed.trim() })
                  }
                  emptyLabel={(typed) =>
                    translate('organiser.pick.none', { typed })
                  }
                  key={number}
                  label={numberLabel(number)}
                  onAdd={(typed) => {
                    const added = addTypedTeam({
                      newClubId: newDirectoryClubId,
                      newTeamId,
                      record,
                      typed
                    })

                    onChange(
                      updatePool(
                        added.record,
                        seatPoolTeam({ number, pool, teamId: added.teamId })
                      )
                    )

                    return null
                  }}
                  onChange={(picked) =>
                    save(seatPoolTeam({ number, pool, teamId: picked }))
                  }
                  picks={teamPicks}
                  placeholder={translate('organiser.pick.teamPlaceholder')}
                  selectedId={teamId}
                />
              ))}
            </div>
          </div>
          <div className='pool-composer-group'>
            <p className='club-label'>
              {translate('club.championship.composer.dates')}
            </p>
            <div className='pool-composer-grid'>
              {numbered(pool.rounds).map(({ entry: round, number }) => (
                <TextField
                  key={number}
                  onChange={(date) =>
                    save(
                      datedRound({
                        date: date === '' ? null : date,
                        pool,
                        roundIndex: number - 1
                      })
                    )
                  }
                  value={round.date ?? ''}
                >
                  <Label>
                    {translate('club.championship.rounds.long', {
                      number: String(number)
                    })}
                  </Label>
                  <Input type='date' />
                </TextField>
              ))}
            </div>
            <p className='club-note'>
              {translate('club.championship.composer.datesHelp')}
            </p>
          </div>
          <div className='pool-composer-group'>
            <p className='club-label'>
              {translate('club.championship.composer.points')}
            </p>
            <div className='pool-composer-points'>
              {STANDINGS_OUTCOMES.map((outcome) => (
                <ChoiceField
                  choices={STANDINGS_VALUES.map((value) => ({
                    id: String(value),
                    label: translate(
                      'club.championship.composer.pointsChoice',
                      {
                        count: value
                      }
                    )
                  }))}
                  key={outcome}
                  label={translate(
                    `club.championship.composer.outcome.${outcome}`
                  )}
                  onChange={(id) => {
                    if (id !== null) {
                      const points: StandingsPoints = {
                        ...pool.points,
                        [outcome]: Number(id)
                      }
                      save({ ...pool, points })
                    }
                  }}
                  selectedId={String(pool.points[outcome])}
                />
              ))}
            </div>
          </div>
          <ConfirmButton
            confirmLabel={translate('club.championship.composer.removeConfirm')}
            label={translate('club.championship.composer.remove')}
            onConfirm={() => onChange(removePool(record, pool.id))}
          />
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}
