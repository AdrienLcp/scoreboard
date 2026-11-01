import type React from 'react'

import type {
  ChampionshipPoolId,
  Fixture,
  FixtureEncounter
} from '@scoreboard/protocol/championship'
import type { ClubRecord } from '@scoreboard/protocol/club-record'
import type { EventSetup } from '@scoreboard/protocol/event-setup'
import type { EventId, TableNumber } from '@scoreboard/protocol/identifiers'
import type { Side } from '@scoreboard/protocol/side'

import {
  fixtureTeamsOf,
  roundIndexForDay
} from '@scoreboard/core/championship/championship-calendar'
import {
  addClubEncounter,
  type ClubSide,
  defaultTablesFor
} from '@scoreboard/core/club/club-encounter'
import { encounterFormatFor } from '@scoreboard/core/encounter/encounter-formats'
import { opponentOf } from '@scoreboard/core/match/opponent'

import {
  currentPoolsOf,
  type FixtureAt,
  playedFixture
} from '@/features/club/championship-edits'
import { clubSideOf, isOwnTeam } from '@/features/club/club-teams'
import { PoolTeamMark } from '@/features/club/pool-team-mark'
import { useClub } from '@/features/club/use-club'
import { nowMs } from '@/infrastructure/clock'
import { dayAsDate, toLocalDay } from '@/infrastructure/dates'
import { newEncounterId, newMatchId } from '@/infrastructure/ids'
import { Button } from '@/presentation/components/button'
import { Icon } from '@/presentation/components/icon'
import { useTranslate } from '@/presentation/i18n/i18n-context'

import './round-encounters.sass'

type RoundEncountersProps = {
  eventId: EventId
  onSave: (setup: EventSetup) => void
  setup: EventSetup
}

/** One of our encounters on the day's round, as the calendar gives it. */
type RoundEntry = {
  at: FixtureAt
  date: string | null
  fixture: Fixture
  home: ClubSide | null
  away: ClubSide | null
  ownSide: Side
  poolId: ChampionshipPoolId
}

const entriesOf = (record: ClubRecord, day: string): RoundEntry[] => {
  const ownTeamIds = record.own.teams.map((team) => team.id)

  return currentPoolsOf(record).flatMap((pool) => {
    const roundIndex = roundIndexForDay({ day, ownTeamIds, pool })
    const round = roundIndex === null ? undefined : pool.rounds[roundIndex]

    if (roundIndex === null || round === undefined) {
      return []
    }

    return round.fixtures.flatMap((fixture, fixtureIndex): RoundEntry[] => {
      const teams = fixtureTeamsOf(pool, fixture)
      const ownSide: Side | null = isOwnTeam(record, teams.home)
        ? 'home'
        : isOwnTeam(record, teams.away)
          ? 'away'
          : null

      return ownSide === null
        ? []
        : [
            {
              at: { fixtureIndex, roundIndex },
              away: clubSideOf(record, teams.away),
              date: round.date,
              fixture,
              home: clubSideOf(record, teams.home),
              ownSide,
              poolId: pool.id
            }
          ]
    })
  })
}

type FixtureLink = {
  at: FixtureAt
  playedAs: FixtureEncounter
  poolId: ChampionshipPoolId
}

type Placed = {
  links: FixtureLink[]
  setup: EventSetup
  tables: { entry: RoundEntry; tables: TableNumber[] }[]
}

/** The day with these encounters added in turn, each on the tables the ones before it left free. */
const placeEncounters = ({
  entries,
  eventId,
  setup
}: {
  entries: readonly RoundEntry[]
  eventId: EventId
  setup: EventSetup
}): Placed =>
  entries.reduce<Placed>(
    (current, entry) => {
      if (entry.home === null || entry.away === null) {
        return current
      }

      const encounterId = newEncounterId()
      const tables = defaultTablesFor({
        format: encounterFormatFor(entry.home.team.formatId),
        preferred: entry.home.team.tables,
        setup: current.setup
      })

      return {
        links: [
          ...current.links,
          {
            at: entry.at,
            playedAs: { encounterId, eventId },
            poolId: entry.poolId
          }
        ],
        setup: addClubEncounter({
          away: entry.away,
          awayColour: entry.away.team.colour,
          encounterId,
          home: entry.home,
          newMatchId,
          setup: current.setup,
          tables
        }),
        tables: [...current.tables, { entry, tables }]
      }
    },
    { links: [], setup, tables: [] }
  )

/**
 * Match day from the club's calendar: each of our encounters of the round,
 * added in one tap with its opponent, who receives, its tables and each
 * team's last composition; its sheet then writes the result into the
 * standings.
 */
export const RoundEncounters: React.FC<RoundEncountersProps> = ({
  eventId,
  onSave,
  setup
}) => {
  const translate = useTranslate()
  const { edit, state } = useClub()

  if (state.status !== 'ready') {
    return null
  }

  const entries = entriesOf(
    state.record,
    toLocalDay(setup.startsAtMs ?? nowMs())
  )

  if (entries.length === 0) {
    return null
  }

  const isAdded = (entry: RoundEntry) =>
    entry.fixture.playedAs?.eventId === eventId &&
    setup.encounters.some(
      (encounter) => encounter.id === entry.fixture.playedAs?.encounterId
    )
  const pending = entries.filter((entry) => !isAdded(entry))
  const preview = placeEncounters({ entries: pending, eventId, setup })
  const pendingHome = pending.filter(
    (entry) => entry.ownSide === 'home' && entry.away !== null
  )
  const roundNumbers = [
    ...new Set(entries.map((entry) => entry.at.roundIndex + 1))
  ]
  const dates = [...new Set(entries.map((entry) => entry.date))]
  const date = dates.length === 1 ? (dates[0] ?? null) : null

  const add = (toAdd: readonly RoundEntry[]) => {
    const placed = placeEncounters({ entries: toAdd, eventId, setup })

    if (placed.links.length === 0) {
      return
    }

    onSave(placed.setup)
    edit((record) =>
      placed.links.reduce(
        (current, link) => playedFixture({ ...link, record: current }),
        record
      )
    )
  }

  return (
    <div className='organiser-panel round-encounters'>
      <h3>
        {roundNumbers.length === 1
          ? translate('organiser.round.title', {
              number: String(roundNumbers[0] ?? 1)
            })
          : translate('organiser.round.titleMixed')}
      </h3>
      <p className='organiser-note'>
        {[
          date === null
            ? null
            : translate('club.championship.rounds.date', {
                at: dayAsDate(date)
              }),
          translate('organiser.round.help')
        ]
          .filter((part) => part !== null)
          .join(' · ')}
      </p>
      <ul className='round-encounter-list'>
        {entries.map((entry) => {
          const own = entry[entry.ownSide]
          const other = entry[opponentOf(entry.ownSide)]
          const tables =
            preview.tables.find((plan) => plan.entry === entry)?.tables ?? []
          const wasAdded = isAdded(entry)

          return (
            <li
              data-added={wasAdded || undefined}
              key={`${entry.poolId}-${entry.at.roundIndex}-${entry.at.fixtureIndex}`}
            >
              <PoolTeamMark
                number={entry.fixture[entry.ownSide]}
                team={own?.team}
              />
              <span className='round-encounter-teams'>
                <span className='round-encounter-own'>{own?.team.name}</span>
                <span className='round-encounter-other'>
                  <Icon name={entry.ownSide === 'home' ? 'home' : 'away'} />
                  <span className='visually-hidden'>
                    {translate(
                      entry.ownSide === 'home'
                        ? 'organiser.round.home'
                        : 'organiser.round.away'
                    )}
                  </span>
                  {other?.team.name ?? translate('organiser.round.unknown')}
                </span>
                {wasAdded || tables.length === 0 ? null : (
                  <span className='round-encounter-tables'>
                    {translate('club.team.tablesChoice', {
                      count: tables.length,
                      tables: tables.map(String)
                    })}
                  </span>
                )}
              </span>
              {wasAdded ? (
                <span className='round-encounter-added'>
                  <Icon name='check' />
                  {translate('organiser.round.added')}
                </span>
              ) : other === null ? null : (
                <Button onPress={() => add([entry])}>
                  <Icon name='plus' />
                  {translate('organiser.round.add')}
                </Button>
              )}
            </li>
          )
        })}
      </ul>
      {pendingHome.length < 2 ? null : (
        <Button onPress={() => add(pendingHome)} variant='primary'>
          <Icon name='plus' />
          {translate('organiser.round.addAll', { count: pendingHome.length })}
        </Button>
      )}
    </div>
  )
}
